const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { plateWeights, weightAtPoint } = require('./site.js');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

test('all 33 loads have exact, balanced, monotonically increasing plate counts', () => {
  let previous = 0;
  for (let weight = 20; weight <= 100; weight += 2.5) {
    const plates = plateWeights(weight);
    assert.equal(20 + 2 * plates.reduce((a, b) => a + b, 0), weight);
    assert.ok(plates.every(p => p === 2.5 || p === 1.25));
    assert.ok(plates.length >= previous);
    previous = plates.length;
  }
  assert.equal(plateWeights(20).length, 0);
  assert.equal(plateWeights(100).length, 16);
});

test('slider is snapped and clamped across mobile and desktop widths', () => {
  for (const width of [240, 280, 320, 390, 460, 600]) {
    assert.equal(weightAtPoint(-1000, 100, width), 20);
    assert.equal(weightAtPoint(10000, 100, width), 100);
    assert.equal(weightAtPoint(100 + width / 2, 100, width), 60);
    for (let step = 0; step <= 32; step++) {
      assert.equal(weightAtPoint(122 + step / 32 * (width - 44), 100, width), 20 + step * 2.5);
    }
  }
});

class FakeElement {
  constructor() {
    this.attributes = {};
    this.dataset = {};
    this.children = [];
    this.events = {};
    this.textContent = '';
    this.value = '';
    this.style = { setProperty(key, value) { this[key] = value; } };
    const classes = new Set();
    this.classList = {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); }
    };
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  appendChild(child) { this.children.push(child); child.parent = this; }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  addEventListener(name, callback) { this.events[name] = callback; }
  focus() {}
  setPointerCapture(id) { this.capture = id; }
  hasPointerCapture(id) { return this.capture === id; }
  releasePointerCapture() { this.capture = null; }
  getBoundingClientRect() { return { left: 100, top: 0, width: 320, height: 54 }; }
  matches() { return false; }
  dispatch(type, values = {}) {
    this.events[type]?.({ type, isPrimary: true, button: 0, pointerId: 1, pointerType: 'mouse', clientX: 260, clientY: 20, preventDefault() {}, ...values });
  }
}

function environment({ reduced = false, intersection = true } = {}) {
  const ids = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new FakeElement()]));
  ids.get('weight').value = '60';
  const translatable = [...html.matchAll(/data-i="([^"]+)"[^>]*>([^<]*)/g)].map(match => {
    const node = new FakeElement(); node.dataset.i = match[1]; node.textContent = match[2]; return node;
  });
  const demo = new FakeElement(), root = new FakeElement();
  const reveal = [new FakeElement(), new FakeElement()];
  const motion = { matches: reduced, addEventListener(name, fn) { this.change = fn; } };
  const timers = new Map(), frames = [];
  let timerId = 0, observer;
  const document = {
    documentElement: root,
    getElementById(id) { assert.ok(ids.has(id), `Missing id: ${id}`); return ids.get(id); },
    createElementNS() { return new FakeElement(); },
    querySelector() { return demo; },
    querySelectorAll(selector) { return selector === '[data-i]' ? translatable : selector === '.bar' ? [] : reveal; }
  };
  function IntersectionObserver(callback) {
    observer = this; this.callback = callback; this.observe = () => {}; this.unobserve = () => {}; this.disconnect = () => {};
  }
  const window = { matchMedia: () => motion };
  if (intersection) window.IntersectionObserver = IntersectionObserver;
  const sandbox = { document, window, IntersectionObserver, console, Intl, requestAnimationFrame: fn => frames.push(fn), setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id) };
  vm.createContext(sandbox);
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'site.js'), 'utf8'), sandbox);
  return {
    ids, root, motion, observer, reveal,
    flushFrames() { while (frames.length) frames.shift()(); },
    flushTimers() { const queued = [...timers.values()]; timers.clear(); queued.forEach(fn => fn()); },
    setWeight(value) { ids.get('weight').value = String(value); ids.get('weight').dispatch('input'); }
  };
}

test('initial SVG stacks, localization, rep bounds and save flow', () => {
  const env = environment(); const $ = id => env.ids.get(id);
  assert.equal($('platesLeft').children.length, 8);
  assert.equal($('platesRight').children.length, 8);
  assert.equal($('barbellModel').dataset.plateCount, '16');
  $('language').dispatch('click');
  assert.equal(env.root.lang, 'en');
  assert.equal($('languageLabel').textContent, 'فارسی');
  assert.equal($('weightValue').textContent, '60');
  assert.equal($('weight').attributes['aria-valuetext'], '60 kilograms');
  for (let i = 0; i < 50; i++) $('plus').dispatch('click');
  assert.equal($('repValue').textContent, '30'); assert.equal($('plus').disabled, true);
  for (let i = 0; i < 50; i++) $('minus').dispatch('click');
  assert.equal($('repValue').textContent, '1'); assert.equal($('minus').disabled, true);
  for (let i = 1; i <= 3; i++) {
    assert.equal($('setLabel').textContent, `Set ${i} of 3`);
    $('save').dispatch('click'); assert.match($('announcement').textContent, /Demo set logged/);
    $('save').dispatch('click');
  }
  assert.equal($('setLabel').textContent, 'Set 1 of 3');
  $('language').dispatch('click'); assert.equal(env.root.dir, 'rtl'); assert.equal($('weightValue').textContent, '۶۰');
});

test('rapid additions, removals and reversals do not leave stale plates', () => {
  const env = environment();
  for (const value of [100, 20, 92.5, 20, 62.5, 100, 20, 60]) env.setWeight(value);
  env.flushFrames(); env.flushTimers();
  assert.equal(env.ids.get('platesLeft').children.length, 8);
  assert.equal(env.ids.get('platesRight').children.length, 8);
  env.setWeight(20); env.flushFrames(); env.flushTimers();
  assert.equal(env.ids.get('platesLeft').children.length, 0);
  env.setWeight(100); env.flushFrames();
  assert.equal(env.ids.get('platesRight').children.length, 16);
});

test('mouse dragging tracks beyond the ruler and releases capture', () => {
  const env = environment(); const weight = env.ids.get('weight');
  weight.dispatch('pointerdown');
  weight.dispatch('pointermove', { clientX: 2000 }); assert.equal(weight.value, '100');
  weight.dispatch('pointermove', { clientX: -2000 }); assert.equal(weight.value, '20');
  weight.dispatch('pointerup', { clientX: -2000 });
  assert.equal(weight.capture, null);
  assert.equal(env.ids.get('weightSlider').classList.contains('is-dragging'), false);
});

test('touch distinguishes horizontal dragging, taps and vertical page scroll', () => {
  const env = environment(); const weight = env.ids.get('weight');
  weight.dispatch('pointerdown', { pointerType: 'touch' });
  weight.dispatch('pointermove', { pointerType: 'touch', clientX: 398 }); assert.equal(weight.value, '100');
  weight.dispatch('pointercancel', { pointerType: 'touch' });
  env.setWeight(60);
  weight.dispatch('pointerdown', { pointerType: 'touch' });
  weight.dispatch('pointermove', { pointerType: 'touch', clientY: 180 }); assert.equal(weight.value, '60');
  weight.dispatch('pointerup', { pointerType: 'touch', clientY: 180 }); assert.equal(weight.value, '60');
  weight.dispatch('pointerdown', { pointerType: 'touch', clientX: 122 });
  weight.dispatch('pointerup', { pointerType: 'touch', clientX: 122 }); assert.equal(weight.value, '20');
});

test('scroll reveal and reduced-motion fallback keep content accessible', () => {
  const env = environment();
  assert.equal(env.root.classList.contains('motion-ready'), true);
  env.observer.callback([{ isIntersecting: true, target: env.reveal[0] }]);
  assert.equal(env.reveal[0].classList.contains('is-visible'), true);
  env.motion.change({ matches: true });
  assert.equal(env.root.classList.contains('motion-ready'), false);
  for (const options of [{ reduced: true }, { intersection: false }]) {
    const fallback = environment(options);
    assert.equal(fallback.root.classList.contains('motion-ready'), false);
    fallback.setWeight(20); fallback.flushTimers();
    assert.equal(fallback.ids.get('platesLeft').children.length, 0);
  }
});

test('all local scripts, styles, fonts and SVG references resolve', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate id');
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  for (const asset of ['site.js', 'motion.css', 'Estedad.woff2', 'Estedad-OFL.txt']) {
    assert.ok(fs.statSync(path.join(__dirname, asset)).size > 0);
  }
  assert.equal(/[↗✓]/u.test(html), false, 'Emoji-capable text icons should be SVG');
});
