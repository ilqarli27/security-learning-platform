console.log("js starting");

const emailinput = document.querySelector("#email");
const passwordinput = document.querySelector("#password");
const loginbttn = document.querySelector("#login");
const resulttext = document.querySelector("#result");
const remainingspan = document.querySelector("#attemp");
const registerbtn = document.querySelector("#register");
const togglePw = document.getElementById("togglePw");
const pwInput = document.getElementById("password");

togglePw.addEventListener("click", () => {
  pwInput.type = pwInput.type === "password" ? "text" : "password";
  togglePw.style.color =
    pwInput.type === "text" ? "var(--accent)" : "var(--muted)";
});

loginbttn.addEventListener("click", async function () {
  const email = emailinput.value;
  const password = passwordinput.value;
  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      loginbttn.disabled = true;
      const text = await res.text(); // <-- burada dəyişdi
      resulttext.textContent = text;
      return;
    }
    const data = await res.json();
    if (res.status === 200) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userRole", data.role);
      if (data.role === "admin") {
        localStorage.setItem("isAdmin", data.role === "admin");
        window.location.href = "/admin";
      } else {
        window.location.href = "/profile";
      }

      return;
    }

    resulttext.textContent = data.message;
    const remaining = data.remaining ?? data.attemp ?? 0;
    remainingspan.textContent = remaining;
  } catch (err) {
    resulttext.textContent = "Server error";
    console.error(err);
  }
});
registerbtn.addEventListener("click", function () {
  window.location.href = "register";
});
