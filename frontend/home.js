const { error } = require("node:console");

// Animated counters
const counters = document.querySelectorAll(".stat-num");

const animateCounter = (el) => {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const step = target / (duration / 16);
  let current = 0;

  const update = () => {
    current += step;
    if (current < target) {
      el.textContent = Math.floor(current);
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  };

  update();
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        counters.forEach(animateCounter);
        observer.disconnect();
      }
    });
  },
  { threshold: 0.5 },
);

if (counters.length) observer.observe(counters[0]);
async function loadData() {
  try {
    const res = await fetch("http://localhost:3000/", {
      method: "GET",
    });

    const data = await res.text();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

loadData();
