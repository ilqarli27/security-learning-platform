function animateCounter(el, target) {
  let current = 0;
  const step = target / (1000 / 16);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current);
  }, 16);
}

function getInitials(email) {
  if (!email) return "??";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "/login";
    return;
  }

  const email = localStorage.getItem("userEmail") || "";
  const role = localStorage.getItem("userRole");

  // Navbar avatarı dərhal göstər
  if (email) {
    const initials = getInitials(email);
    const navAvatar = document.getElementById("nav-avatar");
    const navEmail = document.getElementById("nav-email");
    if (navAvatar) navAvatar.textContent = initials;
    if (navEmail) navEmail.textContent = email;
  }

  // Admin linki göstər
  const adminLink = document.getElementById("admin-link");
  if (adminLink && role === "admin") {
    adminLink.style.display = "inline-flex";
  }

  // pageTag
  const pageTag = document.getElementById("pageTag");
  if (pageTag) {
    pageTag.textContent =
      role === "admin" ? "ADMIN / DASHBOARD" : "USER / PROFILE";
  }

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });
    } finally {
      localStorage.clear();
      window.location.href = "/login";
    }
  }

  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtn2 = document.getElementById("logout-btn-2");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (logoutBtn2) logoutBtn2.addEventListener("click", handleLogout);

  async function tryRefresh() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      window.location.href = "/login";
      return;
    }
    const res = await fetch("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });
    if (!res.ok) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    window.location.reload();
  }

  function renderReports(reports) {
    const list = document.getElementById("report-list");
    if (!list) return;
    if (!reports.length) {
      list.innerHTML =
        '<div class="empty-state">no reports yet. start hunting!</div>';
      return;
    }
    const sevClass = {
      critical: "sev-critical",
      high: "sev-high",
      medium: "sev-medium",
      low: "sev-low",
    };
    list.innerHTML = reports
      .map((r) => {
        const date = new Date(r.created_at).toLocaleDateString("en-GB");
        const shortId = String(r.id).padStart(4, "0").toUpperCase();
        return `
        <div class="report-item">
          <span class="report-id">#${shortId}</span>
          <div class="report-title">
            ${r.title}
            <span>${r.category || "General"} · ${date}</span>
          </div>
          <span class="severity ${sevClass[r.severity] || "sev-low"}">${(r.severity || "low").toUpperCase()}</span>
          <span class="report-status">${r.status}</span>
        </div>
      `;
      })
      .join("");
  }

  async function loadProfile() {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        await tryRefresh();
        return;
      }
      const data = await res.json();

      const initials = getInitials(data.email);
      const avatar = document.getElementById("avatar");
      if (avatar) avatar.textContent = initials;

      const navAvatar = document.getElementById("nav-avatar");
      const navEmail = document.getElementById("nav-email");
      if (navAvatar) navAvatar.textContent = initials;
      if (navEmail) navEmail.textContent = data.email;

      const profileEmail = document.getElementById("profile-email");
      const profileName = document.getElementById("profile-name");
      if (profileEmail) profileEmail.textContent = data.email;
      if (profileName)
        profileName.textContent = data.username || data.email.split("@")[0];

      const metaJoined = document.getElementById("meta-joined");
      if (metaJoined && data.created_at) {
        metaJoined.textContent = new Date(data.created_at).toLocaleDateString(
          "en-GB",
        );
      }

      const statTotal = document.getElementById("stat-total");
      const statAccepted = document.getElementById("stat-accepted");
      const statCritical = document.getElementById("stat-critical");
      const metaReports = document.getElementById("meta-reports");

      if (statTotal) animateCounter(statTotal, data.total || 0);
      if (statAccepted) animateCounter(statAccepted, data.accepted || 0);
      if (statCritical) animateCounter(statCritical, data.critical || 0);
      if (metaReports) metaReports.textContent = data.total || 0;

      // Admin linki API-dan gələn role ilə yenilə
      if (adminLink && data.role === "admin") {
        adminLink.style.display = "inline-flex";
        localStorage.setItem("userRole", "admin");
      }

      renderReports(data.reports || []);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }

  const newReportBtn = document.getElementById("new-report-btn");
  if (newReportBtn) {
    newReportBtn.addEventListener("click", () => {
      window.location.href = "/report";
    });
  }

  const extReportLink = document.getElementById("ext-report-link");
  if (extReportLink) {
    extReportLink.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .getElementById("external-report")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ── EXTERNAL BUG REPORT GENERATOR ───────────────
  let generatedData = null;

  const owaspMap = {
    "SQL Injection": { cat: "A03", full: "A03 - Injection" },
    XSS: { cat: "A03", full: "A03 - Injection / XSS" },
    IDOR: { cat: "A01", full: "A01 - Broken Access Control" },
    CSRF: { cat: "A01", full: "A01 - Broken Access Control" },
    "Broken Auth": {
      cat: "A07",
      full: "A07 - Identification and Authentication Failures",
    },
    "Open Redirect": { cat: "A01", full: "A01 - Broken Access Control" },
    SSRF: { cat: "A10", full: "A10 - Server-Side Request Forgery" },
    RCE: { cat: "A03", full: "A03 - Injection / RCE" },
    "Info Disclosure": {
      cat: "A02",
      full: "A02 - Cryptographic Failures / Info Disclosure",
    },
    Other: { cat: "A04", full: "A04 - Insecure Design" },
  };

  const impactMap = {
    "SQL Injection":
      "An attacker could extract, modify, or delete all data from the database including user credentials and secrets.",
    XSS: "An attacker could steal session cookies, redirect users to malicious sites, or perform actions on behalf of victims.",
    IDOR: "An attacker could access, modify, or delete resources belonging to other users, leading to data exposure or account takeover.",
    CSRF: "An attacker could trick authenticated users into performing unintended actions such as changing settings or making transactions.",
    "Broken Auth":
      "An attacker could gain unauthorized access to user or admin accounts, leading to full account takeover.",
    "Open Redirect":
      "An attacker could redirect users to malicious websites, facilitating phishing attacks.",
    SSRF: "An attacker could reach internal services, potentially exposing internal infrastructure and data.",
    RCE: "An attacker could execute arbitrary commands on the server, leading to full system compromise.",
    "Info Disclosure":
      "Sensitive data such as internal paths, credentials, or user information may be exposed to unauthorized parties.",
    Other:
      "The impact depends on the specific vulnerability. Further analysis is required.",
  };

  const fixMap = {
    "SQL Injection":
      "Use parameterized queries or prepared statements. Never concatenate user input into SQL. Apply least privilege DB accounts.",
    XSS: "Encode all user-supplied output using context-aware encoding. Implement a Content Security Policy (CSP). Sanitize HTML with a trusted library.",
    IDOR: "Implement authorization checks on the server side. Verify that the authenticated user owns or has access to the requested resource.",
    CSRF: "Implement CSRF tokens on all state-changing requests. Use SameSite cookie attributes.",
    "Broken Auth":
      "Enforce strong passwords, rate limiting, account lockout, and MFA. Use secure HttpOnly cookies for sessions.",
    "Open Redirect":
      "Validate and whitelist redirect URLs. Never allow user input to control redirect destinations.",
    SSRF: "Validate and sanitize URLs. Use allowlists for permitted hosts. Block requests to internal IP ranges.",
    RCE: "Never pass user input to system commands. Use safe APIs and apply strict input validation.",
    "Info Disclosure":
      "Disable verbose error messages in production. Review responses for sensitive data leakage.",
    Other:
      "Review the vulnerability and apply relevant secure coding practices and input validation.",
  };

  const extSubmitBtn = document.getElementById("ext-submit-btn");
  if (extSubmitBtn) {
    extSubmitBtn.addEventListener("click", () => {
      const target = document.getElementById("ext-target").value.trim();
      const type = document.getElementById("ext-type").value;
      const severity = document.getElementById("ext-severity").value;
      const what = document.getElementById("ext-what").value.trim();
      const steps = document.getElementById("ext-steps").value.trim();
      const result = document.getElementById("ext-result");

      if (!target || !type || !severity || !what) {
        result.textContent =
          "! target, type, severity and description are required";
        result.style.color = "var(--accent2)";
        return;
      }

      result.textContent = "";
      const owasp = owaspMap[type] || owaspMap["Other"];

      generatedData = {
        title: `${type} vulnerability found at ${target}`,
        category: owasp.cat,
        severity,
        target,
        description: `A ${type} vulnerability was identified at: ${target}\n\n${what}`,
        steps:
          steps ||
          `1. Navigate to ${target}\n2. Observe the ${type} vulnerability\n3. Trigger the issue as described above`,
        impact: impactMap[type] || impactMap["Other"],
        recommendation: fixMap[type] || fixMap["Other"],
        owasp_full: owasp.full,
      };

      const body = document.getElementById("gen-body");
      body.innerHTML = `
        <div class="gen-section"><div class="gen-section-title">Title</div><div class="gen-section-body">${generatedData.title}</div></div>
        <div class="gen-section"><div class="gen-section-title">OWASP Category</div><div class="gen-section-body">${generatedData.owasp_full}</div></div>
        <div class="gen-section"><div class="gen-section-title">Description</div><div class="gen-section-body">${generatedData.description}</div></div>
        <div class="gen-section"><div class="gen-section-title">Steps to Reproduce</div><div class="gen-section-body">${generatedData.steps}</div></div>
        <div class="gen-section"><div class="gen-section-title">Impact</div><div class="gen-section-body">${generatedData.impact}</div></div>
        <div class="gen-section"><div class="gen-section-title">Recommendation</div><div class="gen-section-body">${generatedData.recommendation}</div></div>
      `;

      document.getElementById("generated-report").classList.remove("hidden");
      document
        .getElementById("generated-report")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  const saveGeneratedBtn = document.getElementById("save-generated-btn");
  if (saveGeneratedBtn) {
    saveGeneratedBtn.addEventListener("click", async () => {
      if (!generatedData) return;
      saveGeneratedBtn.textContent = "Saving...";
      saveGeneratedBtn.disabled = true;

      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(generatedData),
        });

        if (res.ok) {
          saveGeneratedBtn.textContent = "✓ Saved!";
          saveGeneratedBtn.style.color = "var(--accent)";
          setTimeout(() => loadProfile(), 1500);
        } else {
          saveGeneratedBtn.textContent = "Error — retry";
          saveGeneratedBtn.disabled = false;
        }
      } catch {
        saveGeneratedBtn.textContent = "Error — retry";
        saveGeneratedBtn.disabled = false;
      }
    });
  }

  loadProfile();
});
