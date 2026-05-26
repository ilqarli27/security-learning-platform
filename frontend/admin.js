document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("userRole");
  if (!accessToken || role !== "admin") {
    window.location.href = "/login";
    return;
  }

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
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
        .forEach((c) => c.classList.add("hidden"));
      document
        .getElementById("tab-" + tab.dataset.tab)
        .classList.remove("hidden");
    });
  });

  // ── ARTICLES ──────────────────────────────────────
  let articles = [];

  async function loadArticles() {
    try {
      const res = await fetch("/api/learn/articles", { headers });
      articles = await res.json();
      renderArticleList(articles);
    } catch {
      document.getElementById("articles-list").innerHTML =
        '<div class="empty-state">could not load.</div>';
    }
  }

  function renderArticleList(data) {
    const list = document.getElementById("articles-list");
    if (!data.length) {
      list.innerHTML = '<div class="empty-state">no articles yet.</div>';
      return;
    }
    list.innerHTML = data
      .map(
        (a) => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">${a.title}</div>
          <div class="data-item-meta">${a.owasp_category || "General"} · ${new Date(a.created_at).toLocaleDateString("en-GB")}</div>
        </div>
        <div class="data-item-actions">
          <button class="btn btn--danger btn--sm" data-delete-article="${a.id}">delete</button>
        </div>
      </div>
    `,
      )
      .join("");

    list.querySelectorAll("[data-delete-article]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this article?")) return;
        await fetch(`/api/learn/articles/${btn.dataset.deleteArticle}`, {
          method: "DELETE",
          headers,
        });
        loadArticles();
      });
    });
  }

  document.getElementById("new-article-btn").addEventListener("click", () => {
    document.getElementById("article-form-card").classList.toggle("hidden");
  });
  document
    .getElementById("cancel-article-btn")
    .addEventListener("click", () => {
      document.getElementById("article-form-card").classList.add("hidden");
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
        document.getElementById("article-form-card").classList.add("hidden");
        loadArticles();
      } else {
        result.textContent = "! " + data.message;
      }
    });

  // ── CODE EXAMPLES ─────────────────────────────────
  let codeExamples = [];

  async function loadCode() {
    try {
      const res = await fetch("/api/learn/code", { headers });
      codeExamples = await res.json();
      renderCodeList(codeExamples);
    } catch {
      document.getElementById("code-list").innerHTML =
        '<div class="empty-state">could not load.</div>';
    }
  }

  function renderCodeList(data) {
    const list = document.getElementById("code-list");
    const sevClass = {
      critical: "sev-critical",
      high: "sev-high",
      medium: "sev-medium",
      low: "sev-low",
    };
    if (!data.length) {
      list.innerHTML = '<div class="empty-state">no code examples yet.</div>';
      return;
    }
    list.innerHTML = data
      .map(
        (c) => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">${c.title}</div>
          <div class="data-item-meta">${c.owasp_category || "?"} · <span class="severity ${sevClass[c.severity] || "sev-low"}">${(c.severity || "low").toUpperCase()}</span></div>
        </div>
        <div class="data-item-actions">
          <button class="btn btn--danger btn--sm" data-delete-code="${c.id}">delete</button>
        </div>
      </div>
    `,
      )
      .join("");

    list.querySelectorAll("[data-delete-code]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this example?")) return;
        await fetch(`/api/learn/code/${btn.dataset.deleteCode}`, {
          method: "DELETE",
          headers,
        });
        loadCode();
      });
    });
  }

  document.getElementById("new-code-btn").addEventListener("click", () => {
    document.getElementById("code-form-card").classList.toggle("hidden");
  });
  document.getElementById("cancel-code-btn").addEventListener("click", () => {
    document.getElementById("code-form-card").classList.add("hidden");
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
        document.getElementById("code-form-card").classList.add("hidden");
        loadCode();
      } else {
        result.textContent = "! " + data.message;
      }
    });

  // ── REPORTS ───────────────────────────────────────
  async function loadReports() {
    try {
      const res = await fetch("/api/admin/reports", { headers });
      const reports = await res.json();
      renderReportList(reports);
    } catch {
      document.getElementById("reports-list").innerHTML =
        '<div class="empty-state">could not load.</div>';
    }
  }

  function renderReportList(data) {
    const list = document.getElementById("reports-list");
    const sevClass = {
      critical: "sev-critical",
      high: "sev-high",
      medium: "sev-medium",
      low: "sev-low",
    };
    if (!data.length) {
      list.innerHTML = '<div class="empty-state">no reports yet.</div>';
      return;
    }
    list.innerHTML = data
      .map(
        (r) => `
      <div class="data-item">
        <div class="data-item-info">
          <div class="data-item-title">#${String(r.id).padStart(4, "0")} — ${r.title}</div>
          <div class="data-item-meta">
            ${r.email || "unknown"} · ${r.category || "?"} · ${new Date(r.created_at).toLocaleDateString("en-GB")}
          </div>
        </div>
        <div class="data-item-actions">
          <span class="severity ${sevClass[r.severity] || "sev-low"}">${(r.severity || "low").toUpperCase()}</span>
          <select class="form-input" style="width:auto;padding:0.3rem 0.5rem;font-size:0.7rem;" data-report-id="${r.id}">
            <option value="open" ${r.status === "open" ? "selected" : ""}>open</option>
            <option value="accepted" ${r.status === "accepted" ? "selected" : ""}>accepted</option>
            <option value="rejected" ${r.status === "rejected" ? "selected" : ""}>rejected</option>
            <option value="fixed" ${r.status === "fixed" ? "selected" : ""}>fixed</option>
          </select>
        </div>
      </div>
    `,
      )
      .join("");

    list.querySelectorAll("[data-report-id]").forEach((sel) => {
      sel.addEventListener("change", async () => {
        await fetch(`/api/admin/reports/${sel.dataset.reportId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: sel.value }),
        });
      });
    });
  }

  // Initial load
  loadArticles();
  loadCode();
  loadReports();
});
