const OWASP = [
  {
    id: "A01",
    name: "Broken Access Control",
    desc: "Users can act outside their intended permissions. Includes IDOR, privilege escalation, and missing authorization checks.",
    tags: ["IDOR", "Auth bypass", "Path traversal"],
  },
  {
    id: "A02",
    name: "Cryptographic Failures",
    desc: "Weak or missing encryption exposes sensitive data. Covers HTTP instead of HTTPS, weak algorithms, hardcoded keys.",
    tags: ["Weak cipher", "HTTP", "Hardcoded keys"],
  },
  {
    id: "A03",
    name: "Injection",
    desc: "Untrusted data is sent to an interpreter. SQL, NoSQL, OS command, and LDAP injection all fall here.",
    tags: ["SQLi", "XSS", "Command injection"],
  },
  {
    id: "A04",
    name: "Insecure Design",
    desc: "Flaws in the architecture itself. Missing threat modeling, insecure business logic, and design shortcuts.",
    tags: ["Design flaw", "Business logic"],
  },
  {
    id: "A05",
    name: "Security Misconfiguration",
    desc: "Default configs, unnecessary features enabled, verbose error messages, missing security headers.",
    tags: ["Default creds", "Open ports", "CORS"],
  },
  {
    id: "A06",
    name: "Vulnerable Components",
    desc: "Using libraries or frameworks with known vulnerabilities. Unpatched dependencies are a common attack vector.",
    tags: ["npm audit", "CVE", "Dependencies"],
  },
  {
    id: "A07",
    name: "Auth & Session Failures",
    desc: "Weak passwords, missing brute-force protection, insecure session tokens, and improper logout handling.",
    tags: ["Brute force", "JWT", "Session"],
  },
  {
    id: "A08",
    name: "Software Integrity Failures",
    desc: "Code and infrastructure updates without integrity verification. Includes insecure CI/CD pipelines.",
    tags: ["Supply chain", "CI/CD", "Deserialization"],
  },
  {
    id: "A09",
    name: "Logging & Monitoring Failures",
    desc: "Insufficient logging means attacks go undetected. No alerting on failed logins or suspicious activity.",
    tags: ["No logs", "Blind spot", "SIEM"],
  },
  {
    id: "A10",
    name: "Server-Side Request Forgery",
    desc: "The server fetches a remote resource from attacker-controlled URL, bypassing firewalls and access controls.",
    tags: ["SSRF", "Internal network", "Metadata"],
  },
];

document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "/login";
    return;
  }

  const role = localStorage.getItem("userRole");
  const isAdmin = role === "admin";

  // Navbar
  const email = localStorage.getItem("userEmail") || "";
  if (email) {
    document.getElementById("nav-avatar").textContent = email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
    document.getElementById("nav-email").textContent = email;
  }
  if (isAdmin) {
    const al = document.getElementById("admin-link");
    if (al) al.style.display = "inline-flex";
  }

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: localStorage.getItem("refreshToken") }),
      });
    } finally {
      localStorage.clear();
      window.location.href = "/login";
    }
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // TABS
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("tab--active"));
      tab.classList.add("tab--active");
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
  });

  // OWASP
  document.getElementById("owasp-grid").innerHTML = OWASP.map(
    (item) => `
    <div class="owasp-card">
      <div class="owasp-num">${item.id}</div>
      <div class="owasp-name">${item.name}</div>
      <div class="owasp-desc">${item.desc}</div>
      <div class="owasp-tags">${item.tags.map((t) => `<span class="owasp-tag">${t}</span>`).join("")}</div>
    </div>
  `,
  ).join("");

  // ── ARTICLES ──────────────────────────────────────
  let allArticles = [];

  document.getElementById("new-article-btn").addEventListener("click", () => {
    document.getElementById("article-form-card").classList.toggle("open");
  });
  document
    .getElementById("cancel-article-btn")
    .addEventListener("click", () => {
      document.getElementById("article-form-card").classList.remove("open");
    });
  document
    .getElementById("save-article-btn")
    .addEventListener("click", async () => {
      const title = document.getElementById("a-title").value.trim();
      const category = document.getElementById("a-category").value;
      const content = document.getElementById("a-content").value.trim();
      const result = document.getElementById("a-result");
      if (!title || !content) {
        result.textContent = "! title and content are required";
        return;
      }

      const res = await fetch("/api/learn/articles", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, owasp_category: category, content }),
      });
      const data = await res.json();
      if (res.ok) {
        result.textContent = "✓ saved";
        result.style.color = "var(--accent)";
        document.getElementById("a-title").value = "";
        document.getElementById("a-content").value = "";
        document.getElementById("article-form-card").classList.remove("open");
        loadArticles();
      } else {
        result.textContent = "! " + data.message;
      }
    });

  async function loadArticles() {
    try {
      const res = await fetch("/api/learn/articles", { headers });
      allArticles = await res.json();
      renderArticles(allArticles);
    } catch {
      document.getElementById("articles-grid").innerHTML =
        '<div class="empty-state">could not load articles.</div>';
    }
  }

  function renderArticles(articles) {
    const grid = document.getElementById("articles-grid");
    if (!articles.length) {
      grid.innerHTML = '<div class="empty-state">no articles yet.</div>';
      return;
    }
    grid.innerHTML = articles
      .map(
        (a) => `
      <div class="article-card" data-id="${a.id}">
        <div class="article-cat">${a.owasp_category || "General"}</div>
        <div class="article-title">${a.title}</div>
        <div class="article-preview">${a.content.slice(0, 120)}...</div>
        <div class="article-meta">
          <span>${a.author_email ? "by " + a.author_email.split("@")[0] : ""}</span>
          <span>${new Date(a.created_at).toLocaleDateString("en-GB")}</span>
          ${isAdmin ? `<button class="btn btn--danger btn--sm" data-delete-article="${a.id}" onclick="event.stopPropagation()">delete</button>` : ""}
        </div>
      </div>
    `,
      )
      .join("");

    grid.querySelectorAll(".article-card").forEach((card) => {
      card.addEventListener("click", () => {
        const article = allArticles.find(
          (a) => String(a.id) === card.dataset.id,
        );
        if (!article) return;
        document.getElementById("modal-tag").textContent =
          article.owasp_category || "GENERAL";
        document.getElementById("modal-title").textContent = article.title;
        document.getElementById("modal-meta").textContent =
          (article.author_email
            ? "by " + article.author_email.split("@")[0] + " · "
            : "") + new Date(article.created_at).toLocaleDateString("en-GB");
        document.getElementById("modal-body").innerHTML = article.content
          .split("\n")
          .map((p) => {
            if (!p) return "";
            const escaped = p
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
            return `<p>${escaped}</p>`;
          })
          .join("");
        document.getElementById("article-modal").classList.remove("hidden");
      });
    });

    if (isAdmin) {
      grid.querySelectorAll("[data-delete-article]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Delete this article?")) return;
          await fetch(`/api/learn/articles/${btn.dataset.deleteArticle}`, {
            method: "DELETE",
            headers,
          });
          loadArticles();
        });
      });
    }
  }

  document.getElementById("article-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    renderArticles(
      allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q),
      ),
    );
  });
  document
    .getElementById("close-article-modal")
    .addEventListener("click", () => {
      document.getElementById("article-modal").classList.add("hidden");
    });
  document.getElementById("article-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  // ── CODE EXAMPLES ─────────────────────────────────
  let allCode = [];

  document.getElementById("new-code-btn").addEventListener("click", () => {
    document.getElementById("code-form-card").classList.toggle("open");
  });
  document.getElementById("cancel-code-btn").addEventListener("click", () => {
    document.getElementById("code-form-card").classList.remove("open");
  });
  document
    .getElementById("save-code-btn")
    .addEventListener("click", async () => {
      const title = document.getElementById("c-title").value.trim();
      const category = document.getElementById("c-category").value;
      const severity = document.getElementById("c-severity").value;
      const vuln = document.getElementById("c-vuln").value.trim();
      const fix = document.getElementById("c-fix").value.trim();
      const explanation = document.getElementById("c-explanation").value.trim();
      const result = document.getElementById("c-result");
      if (!title || !vuln || !fix) {
        result.textContent = "! title, vulnerable code and fix are required";
        return;
      }

      const res = await fetch("/api/learn/code", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          owasp_category: category,
          severity,
          vulnerable_code: vuln,
          fixed_code: fix,
          explanation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        result.textContent = "✓ saved";
        result.style.color = "var(--accent)";
        ["c-title", "c-vuln", "c-fix", "c-explanation"].forEach(
          (id) => (document.getElementById(id).value = ""),
        );
        document.getElementById("code-form-card").classList.remove("open");
        loadCode();
      } else {
        result.textContent = "! " + data.message;
      }
    });

  async function loadCode() {
    try {
      const res = await fetch("/api/learn/code", { headers });
      allCode = await res.json();
      renderCode(allCode);
    } catch {
      document.getElementById("code-grid").innerHTML =
        '<div class="empty-state">could not load code examples.</div>';
    }
  }

  function renderCode(examples) {
    const grid = document.getElementById("code-grid");
    if (!examples.length) {
      grid.innerHTML = '<div class="empty-state">no code examples yet.</div>';
      return;
    }
    const sevClass = {
      critical: "sev-critical",
      high: "sev-high",
      medium: "sev-medium",
      low: "sev-low",
    };
    grid.innerHTML = examples
      .map(
        (c) => `
      <div class="code-card" data-id="${c.id}">
        <div class="code-card-header">
          <span class="code-card-title">${c.title}</span>
          <div class="code-card-badges">
            <span class="severity ${sevClass[c.severity] || "sev-low"}">${(c.severity || "low").toUpperCase()}</span>
            <span class="severity sev-medium">${c.owasp_category || "?"}</span>
            ${isAdmin ? `<button class="btn btn--danger btn--sm" data-delete-code="${c.id}" onclick="event.stopPropagation()">delete</button>` : ""}
          </div>
        </div>
        <div class="code-card-preview">
          <div class="code-snippet">${c.vulnerable_code.split("\n")[0]}</div>
        </div>
        <div class="code-card-author" style="padding:0.5rem 1.1rem;font-family:var(--mono);font-size:0.62rem;color:var(--muted)">by ${c.author_email ? c.author_email.split("@")[0] : "anonymous"}</div>
      </div>
    `,
      )
      .join("");

    grid.querySelectorAll(".code-card").forEach((card) => {
      card.addEventListener("click", () => {
        const ex = allCode.find((c) => String(c.id) === card.dataset.id);
        if (!ex) return;
        document.getElementById("code-modal-tag").textContent =
          ex.owasp_category || "CODE";
        document.getElementById("code-modal-title").textContent = ex.title;
        document.getElementById("code-modal-vuln").textContent =
          ex.vulnerable_code;
        document.getElementById("code-modal-fix").textContent = ex.fixed_code;
        document.getElementById("code-modal-explanation").textContent =
          ex.explanation;
        document.getElementById("code-modal").classList.remove("hidden");
      });
    });

    if (isAdmin) {
      grid.querySelectorAll("[data-delete-code]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm("Delete this example?")) return;
          await fetch(`/api/learn/code/${btn.dataset.deleteCode}`, {
            method: "DELETE",
            headers,
          });
          loadCode();
        });
      });
    }
  }

  document.getElementById("code-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    renderCode(allCode.filter((c) => c.title.toLowerCase().includes(q)));
  });
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");
      const f = btn.dataset.filter;
      renderCode(
        f === "all" ? allCode : allCode.filter((c) => c.owasp_category === f),
      );
    });
  });
  document.getElementById("close-code-modal").addEventListener("click", () => {
    document.getElementById("code-modal").classList.add("hidden");
  });
  document.getElementById("code-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  loadArticles();
  loadCode();
});
