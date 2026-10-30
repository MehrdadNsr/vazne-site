"use strict";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Text comes from the page (data-* attributes written by tools/build.py), so this file has no language strings.
const lang = document.documentElement.lang,
  numbers = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
let moving = !reduced,
  pointer = { x: 0, y: 0 },
  visible = true;
document.body.classList.toggle("motion", moving);
document.body.classList.toggle("paused", !moving);
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("seen");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
const motionButton = document.getElementById("motion");
function updateMotion() {
  motionButton.textContent = motionButton.dataset[moving ? "on" : "off"];
  motionButton.setAttribute("aria-pressed", String(moving));
  document.body.classList.toggle("paused", !moving);
  document
    .querySelectorAll(".chapter .feature,.chapter .visual")
    .forEach((e) => (e.style.animationPlayState = moving ? "running" : "paused"));
}
updateMotion();
motionButton.onclick = () => {
  moving = !moving;
  updateMotion();
};
let completed = false;
document.getElementById("log-set").onclick = () => {
  const kg = document.getElementById("demo-kg"),
    reps = document.getElementById("demo-reps");
  if (!kg.reportValidity() || !reps.reportValidity() || !kg.value || !reps.value) return;
  completed = !completed;
  document.getElementById("active-check").innerHTML = completed
    ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>'
    : "";
  const status = document.getElementById("set-status"),
    button = document.getElementById("log-set");
  status.dataset.set = status.dataset.set || status.textContent;
  button.dataset.label = button.dataset.label || button.textContent;
  status.textContent = completed ? status.dataset.done : status.dataset.set;
  document.getElementById("log-message").textContent = completed ? button.dataset.saved : "";
  button.textContent = completed ? button.dataset.again : button.dataset.label;
};
const host = document.getElementById("scene"),
  slider = document.getElementById("weight");
// The 3D barbell lives in assets/barbell.js (also used on /test/); three.js is skipped for visitors saving data.
let barbell = null,
  plateCount = 4;
VazneBarbell.load(() => {
  barbell = VazneBarbell.create(host);
  if (barbell) barbell.setPlates(plateCount);
});
slider.addEventListener("input", () => {
  const value = Number(slider.value);
  plateCount = (value - 20) / 10;
  if (barbell) barbell.setPlates(plateCount);
  const output = document.getElementById("weight-value"),
    plateLabel = document.getElementById("plate-label");
  output.innerHTML = numbers.format(value) + " <small>" + output.dataset.unit + "</small>";
  plateLabel.textContent = plateLabel.dataset.template.replace("{n}", numbers.format(plateCount));
});
const dust = document.getElementById("dust"),
  ctx = dust.getContext("2d"),
  hero = document.getElementById("hero");
let dw = 0,
  dh = 0;
const dots = Array.from({ length: 65 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.1 + 0.3,
  phase: Math.random() * 6,
}));
function resizeDust() {
  dw = hero.clientWidth;
  dh = hero.clientHeight;
  dust.width = dw;
  dust.height = dh;
}
new ResizeObserver(resizeDust).observe(hero);
resizeDust();
hero.addEventListener("pointermove", (e) => {
  const r = hero.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
});
hero.addEventListener("pointerleave", () => {
  pointer.x = pointer.y = 0;
});
new IntersectionObserver(
  (es) => {
    visible = es[0].isIntersecting;
  },
  { threshold: 0 },
).observe(hero);
let last = 0,
  phase = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || !visible) return;
  const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
  last = now;
  if (moving) phase += dt;
  if (barbell) barbell.step(dt, { moving, phase, pointer, tilt: Math.min(scrollY / innerHeight, 1) });
  if (ctx) {
    ctx.clearRect(0, 0, dw, dh);
    const px = ((pointer.x + 1) * dw) / 2,
      py = ((pointer.y + 1) * dh) / 2;
    for (const d of dots) {
      let x = d.x * dw + (moving ? Math.sin(phase * 0.15 + d.phase) * 12 : 0),
        y = d.y * dh;
      const distance = Math.hypot(x - px, y - py);
      if (moving && distance < 150) {
        x += ((x - px) / 150) * 18;
        y += ((y - py) / 150) * 18;
        ctx.strokeStyle = "rgba(255,75,60," + 0.12 * (1 - distance / 150) + ")";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.fillStyle = d.r > 1 ? "#c5223555" : "#5c6e8740";
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
requestAnimationFrame(frame);
