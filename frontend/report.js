document.addEventListener("DOMContentLoaded", async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "/login";
    return;
  }

  // Nav avatar
  const email = localStorage.getItem("userEmail") || "";
  if (email) {
    const initials = email.split("@")[0].slice(0, 2).toUpperCase();
    document.getElementById("nav-avatar").textContent = initials;
    document.getElementById("nav-email").textContent = email;
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

  // Submit
  document.getElementById("submit-btn").addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const severity = document.getElementById("severity").value;
    const target = document.getElementById("target").value.trim();
    const description = document.getElementById("description").value.trim();
    const steps = document.getElementById("steps").value.trim();
    const impact = document.getElementById("impact").value.trim();
    const recommendation = document
      .getElementById("recommendation")
      .value.trim();
    const result = document.getElementById("result");

    if (!title || !category || !severity || !description || !steps) {
      result.textContent =
        "! title, category, severity, description and steps are required";
      result.style.color = "var(--accent2)";
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.querySelector("span").textContent = "Submitting...";

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          category,
          severity,
          target,
          description,
          steps,
          impact,
          recommendation,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        result.textContent = "✓ report submitted successfully";
        result.style.color = "var(--accent)";
        setTimeout(() => (window.location.href = "/profile"), 1500);
      } else {
        result.textContent = "! " + data.message;
        result.style.color = "var(--accent2)";
        btn.disabled = false;
        btn.querySelector("span").textContent = "Submit Report";
      }
    } catch (err) {
      result.textContent = "! server error";
      result.style.color = "var(--accent2)";
      btn.disabled = false;
      btn.querySelector("span").textContent = "Submit Report";
    }
  });
});
