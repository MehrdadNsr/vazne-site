'use strict';

// Small 2.5 kg plates (and one 1.25 kg plate if needed) keep the count
// monotonic as the weight increases, and make both sides add up exactly.
function plateWeights(total) {
  const units = Math.round((Math.min(100, Math.max(20, Number(total) || 20)) - 20) / 2.5);
  const plates = Array(Math.floor(units / 2)).fill(2.5);
  if (units % 2) plates.push(1.25);
  return plates;
}

function weightAtPoint(clientX, left, width) {
  const ratio = Math.max(0, Math.min(1, (clientX - left - 22) / Math.max(1, width - 44)));
  return 20 + Math.round(ratio * 32) * 2.5;
}

function initVazne() {
  const $ = id => document.getElementById(id);
  const persian = {};
  document.querySelectorAll('[data-i]').forEach(el => { persian[el.dataset.i] = el.textContent; });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const weight = $('weight');
  const slider = $('weightSlider');
  const demo = document.querySelector('.glass-demo');
  const svgNS = 'http://www.w3.org/2000/svg';
  const stacks = [
    { parent: $('platesLeft'), collar: $('collarLeft'), direction: -1, origin: 241, plates: new Map() },
    { parent: $('platesRight'), collar: $('collarRight'), direction: 1, origin: 559, plates: new Map() }
  ];
  let lang = 'fa', reps = 10, set = 1, logged = false, previousWeight = null;
  let activePointer = null;
  const number = n => new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }).format(n);

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function renderPlates(total) {
    const loads = plateWeights(total);
    stacks.forEach(stack => {
      loads.forEach((load, index) => {
        let plate = stack.plates.get(index);
        if (!plate) {
          const slot = svgElement('g', { transform: `translate(${stack.origin + stack.direction * index * 8.5} 167.5) scale(${stack.direction} 1)`, 'data-plate-index': index });
          const motion = svgElement('g', { class: 'plate-motion' });
          const size = svgElement('g', { class: 'plate-size' });
          size.appendChild(svgElement('use', { href: '#plate-shape' }));
          motion.appendChild(size);
          slot.appendChild(motion);
          stack.parent.appendChild(slot);
          plate = { slot, motion, size, timer: null, entering: true };
          stack.plates.set(index, plate);
          const mountedPlate = plate;
          if (previousWeight === null || reducedMotion.matches) {
            motion.classList.add('is-mounted');
            mountedPlate.entering = false;
          } else {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (stack.plates.get(index) === mountedPlate && mountedPlate.timer === null) {
                mountedPlate.motion.classList.add('is-mounted');
                mountedPlate.entering = false;
              }
            }));
          }
        } else if (plate.timer !== null) {
          clearTimeout(plate.timer);
          plate.timer = null;
          plate.motion.classList.add('is-mounted');
        }
        plate.slot.dataset.plateWeight = load;
        plate.size.style.transform = load === 1.25 ? 'scale(.74)' : 'scale(1)';
      });
      stack.plates.forEach((plate, index) => {
        if (index < loads.length || plate.timer !== null) return;
        plate.motion.classList.remove('is-mounted');
        const remove = () => {
          plate.slot.remove();
          stack.plates.delete(index);
        };
        if (reducedMotion.matches) remove();
        else plate.timer = setTimeout(remove, 440);
      });
      const last = loads.length ? (loads.length - 1) * 8.5 + 34 : 9;
      stack.collar.style.transform = `translateX(${stack.origin + stack.direction * last}px)`;
    });
    $('barbellModel').dataset.plateCount = String(loads.length * 2);
    previousWeight = total;
  }

  function update() {
    const total = Number(weight.value);
    const loads = plateWeights(total);
    if (total !== previousWeight) renderPlates(total);
    $('weightValue').textContent = number(total);
    slider.style.setProperty('--weight-position', `${(total - 20) / 80 * 100}%`);
    weight.setAttribute('aria-valuetext', lang === 'fa' ? `${number(total)} کیلوگرم` : `${number(total)} kilograms`);
    $('plateMeta').textContent = lang === 'fa'
      ? (loads.length ? `میلهٔ ۲۰ کیلویی · ${number(loads.length)} صفحه در هر طرف` : 'میلهٔ ۲۰ کیلویی · بدون صفحه')
      : (loads.length ? `20 kg bar · ${loads.length} plates per side` : '20 kg bar · No plates');
    $('barbellModel').setAttribute('aria-label', lang === 'fa'
      ? `هالتر ${number(total)} کیلوگرمی، ${number(loads.length)} صفحه در هر طرف`
      : `${total} kilogram barbell, ${loads.length} plates on each side`);
    demo.classList.toggle('logged', logged);
    $('repValue').textContent = number(reps);
    $('minus').disabled = reps <= 1;
    $('plus').disabled = reps >= 30;
    $('setLabel').textContent = lang === 'fa' ? `ست ${number(set)} از ۳` : `Set ${set} of 3`;
    $('saveLabel').textContent = logged
      ? (lang === 'fa' ? 'ثبت شد · ست بعدی' : 'Logged · Next set')
      : (lang === 'fa' ? 'ثبت ست' : 'Log set');
    $('save').classList.toggle('done', logged);
  }

  function setLanguage(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    const dictionary = lang === 'fa' ? persian : english;
    document.querySelectorAll('[data-i]').forEach(el => { el.textContent = dictionary[el.dataset.i] ?? persian[el.dataset.i]; });
    $('languageLabel').textContent = lang === 'fa' ? 'English' : 'فارسی';
    $('language').setAttribute('aria-label', lang === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی');
    $('minus').setAttribute('aria-label', lang === 'fa' ? 'کم کردن تکرار' : 'Decrease reps');
    $('plus').setAttribute('aria-label', lang === 'fa' ? 'زیاد کردن تکرار' : 'Increase reps');
    $('sampleChart').setAttribute('aria-label', lang === 'fa' ? 'نمودار نمونهٔ افزایش وزنه در شش جلسه' : 'Illustrative chart of increasing weight over six sessions');
    $('announcement').textContent = '';
    document.title = lang === 'fa' ? 'وزنه | هر ست، یک قدم جلوتر' : 'Vazne | Every set. A step forward.';
    update();
  }

  function changeWeightAt(clientX) {
    const bounds = slider.getBoundingClientRect();
    const next = weightAtPoint(clientX, bounds.left, bounds.width);
    if (Number(weight.value) === next) return;
    weight.value = String(next);
    logged = false;
    update();
  }

  // Keep the native range for keyboard/screen readers; capture horizontal
  // pointer gestures across the whole ruler, including outside its thumb.
  // pan-y preserves vertical page scrolling and pointercancel cleans up it.
  weight.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || activePointer) return;
    event.preventDefault();
    weight.focus({ preventScroll: true });
    activePointer = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: event.pointerType === 'touch' ? null : 'x' };
    weight.setPointerCapture(event.pointerId);
    if (activePointer.axis === 'x') {
      slider.classList.add('is-dragging');
      changeWeightAt(event.clientX);
    }
  });
  weight.addEventListener('pointermove', event => {
    if (!activePointer || event.pointerId !== activePointer.id) return;
    if (!activePointer.axis) {
      const dx = Math.abs(event.clientX - activePointer.x);
      const dy = Math.abs(event.clientY - activePointer.y);
      if (Math.max(dx, dy) < 5) return;
      activePointer.axis = dx >= dy ? 'x' : 'y';
    }
    if (activePointer.axis !== 'x') return;
    slider.classList.add('is-dragging');
    changeWeightAt(event.clientX);
  });
  function endPointer(event) {
    if (!activePointer || event.pointerId !== activePointer.id) return;
    if (event.type === 'pointerup' && activePointer.axis !== 'y') changeWeightAt(event.clientX);
    const id = activePointer.id;
    activePointer = null;
    slider.classList.remove('is-dragging');
    if (weight.hasPointerCapture(id)) weight.releasePointerCapture(id);
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => weight.addEventListener(type, endPointer));
  weight.addEventListener('input', () => { logged = false; update(); });
  $('language').addEventListener('click', () => setLanguage(lang === 'fa' ? 'en' : 'fa'));
  $('minus').addEventListener('click', () => { reps = Math.max(1, reps - 1); logged = false; update(); });
  $('plus').addEventListener('click', () => { reps = Math.min(30, reps + 1); logged = false; update(); });
  $('save').addEventListener('click', () => {
    if (logged) {
      set = set === 3 ? 1 : set + 1;
      logged = false;
      $('announcement').textContent = '';
    } else {
      logged = true;
      $('announcement').textContent = lang === 'fa'
        ? `ست نمونه با ${number(Number(weight.value))} کیلو و ${number(reps)} تکرار ثبت شد.`
        : `Demo set logged: ${weight.value} kg, ${reps} reps.`;
    }
    update();
  });
  update();

  function initReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const targets = [...document.querySelectorAll('.hero-copy > *, .preview-wrap, .strip > span, .section-top, .feature, .progress-section > div, .download > *, .footer')];
    targets.forEach((element, index) => {
      element.classList.add('reveal');
      const staggered = element.matches('.feature, .strip > span, .hero-copy > *');
      element.style.setProperty('--reveal-delay', `${staggered ? (index % 3) * 75 : 0}ms`);
    });
    document.querySelectorAll('.bar').forEach((bar, index) => bar.style.setProperty('--bar-index', index));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      targets.forEach(element => element.classList.add('is-visible'));
      document.documentElement.classList.remove('motion-ready');
    });
  }
  initReveals();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { plateWeights, weightAtPoint };
} else {
  initVazne();
}
