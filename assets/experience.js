"use strict";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Text comes from the page (data-* attributes written by tools/build.py), so this file has no language strings.
const lang = document.documentElement.lang,
  numbers = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
let moving = !reduced,
  pointer = { x: 0, y: 0 },
  drag = 0,
  dragging = false,
  lastX = 0,
  raf = 0,
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
let renderer,
  scene,
  camera,
  bar,
  plates = [],
  targetCount = 4;
// The 3D barbell needs three.js (about 170 KB over the network). Skip it for visitors who asked to save data or are on a
// 2G connection (mobile data is expensive in Iran): the drawn barbell (.poster) stays in its place.
function startThree() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor(0xf3f4f6, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    host.prepend(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      host.classList.remove("rendered");
      renderer = null;
    });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.8, 13);
    camera.lookAt(0, 0, 0);
    bar = new THREE.Group();
    scene.add(bar);
    bar.rotation.set(0.08, 0.2, -0.15);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64718a, 3));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 6, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe73950, 3);
    rim.position.set(3, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb9c9ee, 2);
    fill.position.set(-4, -1, 3);
    scene.add(fill);
    const steel = new THREE.MeshStandardMaterial({ color: 0xa2a6ae, metalness: 0.85, roughness: 0.28 }),
      rubber = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.28, roughness: 0.48 }),
      edge = new THREE.MeshStandardMaterial({ color: 0x3d3e43, metalness: 0.55, roughness: 0.35 }),
      red = new THREE.MeshStandardMaterial({
        color: 0xe4392e,
        metalness: 0.45,
        roughness: 0.35,
        emissive: 0x4c0804,
        emissiveIntensity: 0.35,
      });
    function cylinder(radius, length, material, parent, x = 0) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 64), material);
      m.rotation.z = Math.PI / 2;
      m.position.x = x;
      parent.add(m);
      return m;
    }
    function ring(radius, tube, material, parent, x) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material);
      m.rotation.y = Math.PI / 2;
      m.position.x = x;
      parent.add(m);
    }
    cylinder(0.073, 8.4, steel, bar);
    cylinder(0.11, 2.5, edge, bar);
    for (const sign of [-1, 1]) {
      cylinder(0.125, 1.8, steel, bar, sign * 3.15);
      cylinder(0.19, 0.15, steel, bar, sign * 2.18);
      for (let j = 0; j < 44; j++) ring(0.078, 0.005, edge, bar, sign * (0.3 + j * 0.031));
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Group();
        cylinder(0.87, 0.17, rubber, p);
        ring(0.83, 0.027, edge, p, -0.085);
        ring(0.83, 0.027, edge, p, 0.085);
        cylinder(0.25, 0.186, steel, p);
        ring(0.64, 0.012, i === 0 ? red : edge, p, -0.09);
        ring(0.64, 0.012, i === 0 ? red : edge, p, 0.09);
        p.userData = { index: i, sign, alpha: i < 4 ? 1 : 0 };
        p.position.x = sign * (2.33 + i * 0.195);
        p.scale.setScalar(i < 4 ? 1 : 0.001);
        p.visible = i < 4;
        bar.add(p);
        plates.push(p);
      }
    }
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = camera.aspect < 1 ? 16 : 12.5;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host);
    resize();
    host.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener("pointermove", (e) => {
      if (dragging) {
        drag += (e.clientX - lastX) * 0.006;
        lastX = e.clientX;
      }
    });
    const end = () => (dragging = false);
    host.addEventListener("pointerup", end);
    host.addEventListener("pointercancel", end);
    host.addEventListener("lostpointercapture", end);
  } catch (error) {
    host.classList.add("unavailable");
    host.classList.remove("rendered");
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }
    renderer = null;
  }
}
const connection = navigator.connection || {};
if (!connection.saveData && !/2g$/.test(connection.effectiveType || "")) {
  const three = document.createElement("script");
  three.src = "/assets/three-0.160.1.min.js";
  three.onload = startThree;
  document.head.appendChild(three);
}
slider.addEventListener("input", () => {
  const value = Number(slider.value);
  targetCount = (value - 20) / 10;
  const output = document.getElementById("weight-value"),
    plateLabel = document.getElementById("plate-label");
  output.innerHTML = numbers.format(value) + " <small>" + output.dataset.unit + "</small>";
  plateLabel.textContent = plateLabel.dataset.template.replace("{n}", numbers.format(targetCount));
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
  raf = requestAnimationFrame(frame);
  if (document.hidden || !visible) return;
  const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
  last = now;
  if (moving) phase += dt;
  const ease = 1 - Math.exp(-dt * 7);
  if (renderer) {
    bar.rotation.y += (drag + (moving ? pointer.x * 0.24 : 0) + 0.25 - bar.rotation.y) * ease;
    bar.rotation.x += ((moving ? pointer.y * 0.1 : 0) + 0.1 - bar.rotation.x) * ease;
    bar.rotation.z = -0.16 + (moving ? Math.sin(phase * 0.4) * 0.035 + Math.min(scrollY / innerHeight, 1) * 0.16 : 0);
    bar.position.y = moving ? Math.sin(phase * 0.8) * 0.07 : 0;
    for (const p of plates) {
      const on = p.userData.index < targetCount;
      p.userData.alpha = moving ? p.userData.alpha + ((on ? 1 : 0) - p.userData.alpha) * ease : on ? 1 : 0;
      const a = p.userData.alpha;
      p.visible = a > 0.005;
      p.scale.setScalar(Math.max(0.001, a));
      p.position.x = p.userData.sign * (2.33 + p.userData.index * 0.195 + (1 - a) * 1.5);
    }
    renderer.render(scene, camera);
    host.classList.add("rendered");
  }
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
