/*
 * The 3D barbell (three.js), shared by the home page and the tester page.
 *
 * VazneBarbell.load(callback)  loads three.js once, then calls back. Never loads it for visitors in data-saver mode or
 *                              on 2G (mobile data is expensive in Iran): the drawn barbell (.poster) stays instead.
 * VazneBarbell.create(host, { fit }) → controller, or null without WebGL. The canvas goes into `host`, which gets the
 *                              class "rendered" once drawn (CSS then hides the poster). Dragging sideways turns the bar.
 *   controller.step(dt, { moving, phase, pointer: {x, y}, tilt, turn })   advance and draw one frame
 *   controller.setPlates(n)    plates per side (0–8), animated
 * Any element with data-barbell="idle" (the tester page) gets a small, slowly turning barbell automatically.
 */
(function () {
  'use strict';
  var waiting = null;

  function load(callback) {
    var connection = navigator.connection || {};
    if (connection.saveData || /2g$/.test(connection.effectiveType || '')) return;
    if (window.THREE) return callback();
    if (!waiting) {
      waiting = [];
      var script = document.createElement('script');
      script.src = '/assets/three-0.160.1.min.js';
      script.onload = function () { waiting.forEach(function (fn) { fn(); }); };
      document.head.appendChild(script);
    }
    waiting.push(callback);
  }

  function create(host, options) {
    options = options || {};
    var THREE = window.THREE, renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (error) {
      host.classList.add('unavailable');
      return null;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor(0xf3f4f6, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    host.prepend(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      host.classList.remove('rendered');
      renderer = null;
    });

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.8, 13);
    camera.lookAt(0, 0, 0);
    var bar = new THREE.Group();
    scene.add(bar);
    bar.rotation.set(0.08, 0.2, -0.15);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64718a, 3));
    var key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 6, 4);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xe73950, 3);
    rim.position.set(3, 2, -3);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xb9c9ee, 2);
    fill.position.set(-4, -1, 3);
    scene.add(fill);
    var steel = new THREE.MeshStandardMaterial({ color: 0xa2a6ae, metalness: 0.85, roughness: 0.28 }),
      rubber = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.28, roughness: 0.48 }),
      edge = new THREE.MeshStandardMaterial({ color: 0x3d3e43, metalness: 0.55, roughness: 0.35 }),
      red = new THREE.MeshStandardMaterial({ color: 0xe4392e, metalness: 0.45, roughness: 0.35, emissive: 0x4c0804, emissiveIntensity: 0.35 });
    function cylinder(radius, length, material, parent, x) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 64), material);
      m.rotation.z = Math.PI / 2;
      m.position.x = x || 0;
      parent.add(m);
    }
    function ring(radius, tube, material, parent, x) {
      var m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material);
      m.rotation.y = Math.PI / 2;
      m.position.x = x;
      parent.add(m);
    }
    var plates = [];
    cylinder(0.073, 8.4, steel, bar);
    cylinder(0.11, 2.5, edge, bar);
    [-1, 1].forEach(function (sign) {
      cylinder(0.125, 1.8, steel, bar, sign * 3.15);
      cylinder(0.19, 0.15, steel, bar, sign * 2.18);
      for (var j = 0; j < 44; j++) ring(0.078, 0.005, edge, bar, sign * (0.3 + j * 0.031));
      for (var i = 0; i < 8; i++) {
        var p = new THREE.Group();
        cylinder(0.87, 0.17, rubber, p);
        ring(0.83, 0.027, edge, p, -0.085);
        ring(0.83, 0.027, edge, p, 0.085);
        cylinder(0.25, 0.186, steel, p);
        ring(0.64, 0.012, i === 0 ? red : edge, p, -0.09);
        ring(0.64, 0.012, i === 0 ? red : edge, p, 0.09);
        p.userData = { index: i, sign: sign, alpha: i < 4 ? 1 : 0 };
        p.position.x = sign * (2.33 + i * 0.195);
        p.scale.setScalar(i < 4 ? 1 : 0.001);
        p.visible = i < 4;
        bar.add(p);
        plates.push(p);
      }
    });

    function resize() {
      if (!renderer) return;
      var w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // fit: a short, wide strip (tester page) frames the whole bar; otherwise the home page's framing
      if (options.fit) {
        camera.position.set(0, 1, Math.max(8.6, 11.5 / (0.5735 * camera.aspect)));
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.z = camera.aspect < 1 ? 16 : 12.5;
      }
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(host);
    resize();

    var controller = { drag: 0, targetCount: 4 };
    var dragging = false, lastX = 0;
    host.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      controller.drag += (e.clientX - lastX) * 0.006;
      lastX = e.clientX;
    });
    function end() { dragging = false; }
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    host.addEventListener('lostpointercapture', end);

    controller.setPlates = function (n) { controller.targetCount = n; };
    controller.step = function (dt, s) {
      if (!renderer) return;
      var moving = s.moving, pointer = s.pointer || { x: 0, y: 0 };
      var ease = 1 - Math.exp(-dt * 7);
      bar.rotation.y += (controller.drag + (s.turn || 0) + (moving ? pointer.x * 0.24 : 0) + 0.25 - bar.rotation.y) * ease;
      bar.rotation.x += ((moving ? pointer.y * 0.1 : 0) + 0.1 - bar.rotation.x) * ease;
      bar.rotation.z = -0.16 + (moving ? Math.sin(s.phase * 0.4) * 0.035 + (s.tilt || 0) * 0.16 : 0);
      bar.position.y = moving ? Math.sin(s.phase * 0.8) * 0.07 : 0;
      plates.forEach(function (p) {
        var on = p.userData.index < controller.targetCount;
        p.userData.alpha = moving ? p.userData.alpha + ((on ? 1 : 0) - p.userData.alpha) * ease : on ? 1 : 0;
        var a = p.userData.alpha;
        p.visible = a > 0.005;
        p.scale.setScalar(Math.max(0.001, a));
        p.position.x = p.userData.sign * (2.33 + p.userData.index * 0.195 + (1 - a) * 1.5);
      });
      renderer.render(scene, camera);
      host.classList.add('rendered');
    };
    return controller;
  }

  // A small barbell that turns slowly on its own (tester page). Still when the visitor prefers reduced motion.
  function mountIdle(host) {
    load(function () {
      var barbell = create(host, { fit: true });
      if (!barbell) return;
      var moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      var visible = true, last = 0, phase = 0;
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(host);
      function frame(now) {
        requestAnimationFrame(frame);
        if (document.hidden || !visible) return;
        var dt = Math.min((now - last) / 1000 || 0.016, 0.05);
        last = now;
        if (moving) phase += dt;
        barbell.step(dt, { moving: moving, phase: phase, turn: moving ? Math.sin(phase * 0.35) * 0.45 : 0 });
      }
      requestAnimationFrame(frame);
    });
  }

  window.VazneBarbell = { load: load, create: create };
  function mountAll() { document.querySelectorAll('[data-barbell="idle"]').forEach(mountIdle); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
