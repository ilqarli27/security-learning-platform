const emailinput = document.querySelector("#email");
const passwordinput = document.querySelector("#password");
const passwordcorrect = document.querySelector("#confirmpassword");
const registerbtn = document.querySelector("#registerbtn");
const resulttext = document.querySelector("#result");
const togglePw = document.getElementById("togglePw");
document.querySelectorAll(".toggle-pw").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
    btn.style.color = input.type === "text" ? "var(--accent)" : "var(--muted)";
  });
});
const pwInput = document.getElementById("password");
const fill = document.getElementById("strengthFill");
const label = document.getElementById("strengthLabel");

pwInput.addEventListener("input", () => {
  const v = pwInput.value;
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  const levels = [
    { pct: "0%", color: "transparent", text: "" },
    { pct: "25%", color: "var(--accent2)", text: "Weak" },
    { pct: "50%", color: "var(--accent3)", text: "Fair" },
    { pct: "75%", color: "var(--accent3)", text: "Good" },
    { pct: "100%", color: "var(--accent)", text: "Strong" },
  ];

  fill.style.width = levels[score].pct;
  fill.style.background = levels[score].color;
  label.textContent = levels[score].text;
  label.style.color = levels[score].color;
});

registerbtn.addEventListener("click", async function () {
  const email = emailinput.value;
  const password = passwordinput.value;
  const password1 = passwordcorrect.value;
  if (password !== password1) {
    resulttext.textContent = "sifreler uygun deyil";
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    resulttext.textContent = data.message;
  } catch (err) {
    console.error(err);
    resulttext.textContent = "Server error";
  }
});
