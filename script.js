(function () {
  'use strict';
  const cfg = window.SITE_CONFIG || {};
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reduceMQ.matches;
  // Registered first so every later listener sees the updated value.
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', (e) => { reduceMotion = e.matches; });

  /* ---------- Config binding ---------- */
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.getAttribute('data-bind');
    if (cfg[key]) el.textContent = cfg[key];
  });
  if (cfg.name && cfg.title) document.title = cfg.name + ' — ' + cfg.title;
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    document.body.classList.toggle('nav-open', open);
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.section-header, .about-card, .about-text, .skill-card, .marquee, .carousel, .projects-more, .timeline-item, .contact-card');
  revealEls.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Typing effect (hero) ---------- */
  (function typing() {
    const el = document.getElementById('typed');
    if (!el) return;
    const roles = [cfg.title || el.textContent].concat(cfg.extraRoles || []).filter((r, i, a) => r && a.indexOf(r) === i);
    el.textContent = roles[0];
    if (roles.length < 2) return;
    let roleIdx = 0, charIdx = roles[0].length, deleting = true, timer = null;
    const step = () => {
      if (reduceMotion) { el.textContent = roles[0]; timer = null; return; }
      const word = roles[roleIdx];
      let delay;
      if (deleting) {
        charIdx--;
        el.textContent = word.slice(0, charIdx);
        delay = 38;
        if (charIdx <= 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 350; }
      } else {
        const next = roles[roleIdx];
        charIdx++;
        el.textContent = next.slice(0, charIdx);
        delay = 75;
        if (charIdx >= next.length) { deleting = true; delay = 2200; }
      }
      timer = setTimeout(step, delay);
    };
    const start = () => { if (!timer && !reduceMotion) timer = setTimeout(step, 2600); };
    start();
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', () => {
      if (reduceMotion) { clearTimeout(timer); timer = null; roleIdx = 0; charIdx = roles[0].length; deleting = true; el.textContent = roles[0]; }
      else start();
    });
  })();

  /* ---------- Tech marquee ---------- */
  (function marquee() {
    const wrap = document.getElementById('techMarquee');
    if (!wrap) return;
    const track = wrap.querySelector('.marquee-track');
    const originals = Array.from(track.children);
    let built = false;
    const build = () => {
      // reset
      Array.from(track.querySelectorAll('[data-clone]')).forEach((n) => n.remove());
      built = false;
      if (reduceMotion) { wrap.classList.remove('is-animated'); return; }
      // Repeat the base set until one "half" is wider than the container, then duplicate that half.
      const setWidth = track.scrollWidth || 1;
      const reps = Math.max(1, Math.ceil(wrap.clientWidth / setWidth));
      const addSet = () => originals.forEach((li) => {
        const c = li.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
      });
      for (let i = 1; i < reps; i++) addSet();
      const half = track.children.length;
      for (let i = 0; i < half; i++) {
        const c = track.children[i].cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
      }
      const halfWidth = track.scrollWidth / 2;
      track.style.setProperty('--marquee-duration', Math.max(18, halfWidth / 45) + 's');
      wrap.classList.add('is-animated');
      built = true;
    };
    build();
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; build(); } });
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  })();

  /* ---------- Project carousel ---------- */
  (function carousel() {
    const root = document.getElementById('projectCarousel');
    if (!root) return;
    const track = root.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const dotsWrap = root.querySelector('.carousel-dots');
    const counter = document.getElementById('carouselCurrent');
    const playBtn = document.getElementById('carouselPlay');
    const progress = root.querySelector('.carousel-autoprogress span');
    const total = slides.length;
    const interval = Number(cfg.carouselAutoplayMs) || 0;
    let index = 0, timer = null, userPaused = reduceMotion, hoverPaused = false;

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot';
      b.setAttribute('aria-label', 'Tampilkan proyek ' + (i + 1) + ' dari ' + total);
      b.addEventListener('click', () => { goTo(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });

    const pad = (n) => String(n).padStart(2, '0');
    function render(announce) {
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      slides.forEach((s, i) => {
        const active = i === index;
        s.setAttribute('aria-hidden', String(!active));
        if ('inert' in s) s.inert = !active;
        s.classList.toggle('is-active', active);
      });
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
        if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (counter) counter.textContent = pad(index + 1);
      track.setAttribute('aria-live', announce ? 'polite' : 'off');
    }
    function goTo(i, byUser) {
      index = (i + total) % total;
      render(!!byUser);
      if (byUser) restart();
    }
    const next = (byUser) => goTo(index + 1, byUser);
    const prev = (byUser) => goTo(index - 1, byUser);

    // Autoplay
    const canAutoplay = () => interval > 0 && !userPaused && !hoverPaused && !document.hidden;
    function stop() {
      clearTimeout(timer); timer = null;
      if (progress) { progress.style.transition = 'none'; progress.style.transform = 'scaleX(0)'; }
    }
    function restart() {
      stop();
      if (!canAutoplay()) return;
      if (progress) {
        void progress.offsetWidth;
        progress.style.transition = 'transform ' + interval + 'ms linear';
        progress.style.transform = 'scaleX(1)';
      }
      timer = setTimeout(() => { next(false); restart(); }, interval);
    }
    function updatePlayBtn() {
      const paused = userPaused || interval <= 0;
      playBtn.classList.toggle('is-paused', paused);
      playBtn.setAttribute('aria-label', paused ? 'Mulai pergantian otomatis' : 'Jeda pergantian otomatis');
      playBtn.hidden = interval <= 0;
    }
    playBtn.addEventListener('click', () => {
      userPaused = !userPaused; updatePlayBtn(); restart();
    });
    root.addEventListener('mouseenter', () => { hoverPaused = true; stop(); });
    root.addEventListener('mouseleave', () => { hoverPaused = false; restart(); });
    root.addEventListener('focusin', () => { hoverPaused = true; stop(); });
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { hoverPaused = false; restart(); } });
    document.addEventListener('visibilitychange', restart);

    root.querySelectorAll('.carousel-btn').forEach((b) =>
      b.addEventListener('click', () => (b.dataset.dir === 'next' ? next(true) : prev(true))));

    // Keyboard
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(true); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0, true); }
      else if (e.key === 'End') { e.preventDefault(); goTo(total - 1, true); }
    });

    // Swipe / drag (pointer events)
    const viewport = root.querySelector('.carousel-viewport');
    let startX = 0, startY = 0, dx = 0, dragging = false, locked = null, pid = null;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; locked = null; dx = 0; startX = e.clientX; startY = e.clientY; pid = e.pointerId;
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pid) return;
      const mx = e.clientX - startX, my = e.clientY - startY;
      if (locked === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
        locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (locked === 'x') { viewport.setPointerCapture(pid); track.classList.add('dragging'); stop(); }
      }
      if (locked !== 'x') return;
      dx = mx;
      const w = viewport.clientWidth || 1;
      track.style.transform = 'translate3d(calc(' + (-index * 100) + '% + ' + dx + 'px),0,0)';
      if (Math.abs(dx) / w > 0.02) e.preventDefault();
    });
    const endDrag = (e) => {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      track.classList.remove('dragging');
      if (locked === 'x') {
        const w = viewport.clientWidth || 1;
        if (Math.abs(dx) > Math.min(80, w * 0.18)) { dx < 0 ? next(true) : prev(true); }
        else { render(false); restart(); }
      }
      locked = null; dx = 0;
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    // Prevent link/image ghost-drag
    viewport.addEventListener('dragstart', (e) => e.preventDefault());

    reduceMQ.addEventListener && reduceMQ.addEventListener('change', () => { userPaused = reduceMotion; updatePlayBtn(); restart(); });

    render(false);
    updatePlayBtn();
    // Start autoplay only once the carousel is on screen
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) restart(); else stop(); });
      }, { threshold: 0.3 });
      vio.observe(root);
    } else restart();
  })();

  /* ---------- Parallax + scroll progress + header (single rAF loop) ---------- */
  (function scrollFx() {
    const header = document.getElementById('header');
    const bar = document.getElementById('scrollProgress');
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const items = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => ({
      el,
      speed: parseFloat(el.getAttribute('data-parallax')) || 0,
      max: parseFloat(el.getAttribute('data-max')) || 80,
      content: el.hasAttribute('data-content'),
      center: 0,
      last: null,
    }));
    let vh = window.innerHeight, vw = window.innerWidth, ticking = false;

    const docTop = (el) => { let t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
    function measure() {
      vh = window.innerHeight; vw = window.innerWidth;
      items.forEach((it) => { it.center = docTop(it.el) + it.el.offsetHeight / 2; });
    }
    function parallaxFactor() {
      if (reduceMotion) return 0;
      return vw < 768 ? 0.4 : 1; // toned down on mobile
    }
    function update() {
      ticking = false;
      const y = window.scrollY || window.pageYOffset;
      // header + progress
      header.classList.toggle('scrolled', y > 10);
      const max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      // active nav
      let current = sections[0];
      sections.forEach((s) => { if (s.offsetTop <= y + 120) current = s; });
      links.forEach((l) => l.classList.toggle('active', current && l.getAttribute('href') === '#' + current.id));
      // parallax
      const f = parallaxFactor();
      const vc = y + vh / 2;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const dist = it.center - vc;
        let t = f === 0 ? 0 : dist * it.speed * f;
        const lim = it.max * (f === 0 ? 0 : f < 1 ? 0.6 : 1);
        if (t > lim) t = lim; else if (t < -lim) t = -lim;
        t = Math.round(t * 10) / 10;
        if (t !== it.last) { it.el.style.transform = t === 0 && f === 0 ? '' : 'translate3d(0,' + t + 'px,0)'; it.last = t; }
      }
    }
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    // Only re-measure on width changes (avoids jank from mobile URL-bar height changes)
    window.addEventListener('resize', () => {
      if (window.innerWidth !== vw) { measure(); request(); }
    });
    window.addEventListener('load', () => { measure(); request(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', request);
    measure();
    update();
  })();
})();
