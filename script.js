(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#FFD88A', '#FF8FB8', '#8B5CF6', '#FFFFFF', '#ffb347'];

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('in'), 2800);
  };

  /* ---------- Stars ---------- */
  const starsEl = $('#stars');
  const starCount = reduce ? 30 : 70;
  for (let i = 0; i < starCount; i++) {
    const s = document.createElement('i');
    s.className = 'star';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s`;
    starsEl.appendChild(s);
  }

  /* ---------- Canvas FX: confetti, particles, fireworks (one rAF loop, stops when idle) ---------- */
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  let parts = [], raf = null, W = 0, H = 0;
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * d; canvas.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const burst = (x, y, n = 90, opts = {}) => {
    if (reduce) n = Math.min(n, 25);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (opts.speed || 8) * (0.4 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.lift || 4), g: opts.g ?? 0.18,
        size: 4 + Math.random() * 5, life: 1, decay: 0.006 + Math.random() * 0.01,
        c: opts.gold ? (Math.random() < .7 ? '#FFD88A' : '#fff') : COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * 6, vr: Math.random() * .3 - .15, heart: !!opts.hearts && Math.random() < .5, spark: !!opts.spark });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life > 0 && p.y < H + 40);
    for (const p of parts) {
      p.vx *= .985; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      if (p.heart) { ctx.font = p.size * 3 + 'px serif'; ctx.fillText('❤', p.x, p.y); }
      else if (p.spark) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill(); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(tick) : (ctx.clearRect(0, 0, W, H), null);
  };
  const confetti = (x = W / 2, y = H / 2) => { burst(x, y, 110); burst(x, y, 50, { gold: true, spark: true, speed: 10 }); };
  const goldHearts = (x, y) => { burst(x, y, 60, { gold: true, spark: true, speed: 9 }); burst(x, y, 24, { hearts: true, g: -0.03, speed: 4, lift: 1 }); };
  const fireworks = (count = 6) => {
    for (let i = 0; i < count; i++) setTimeout(() =>
      burst(W * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.35), 60, { gold: Math.random() < .5, spark: true, g: .06, speed: 7, lift: 0 }), i * 450);
  };

  /* ---------- Hero floaters (balloons + hearts) ---------- */
  const floaters = $('#floaters');
  if (!reduce) {
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('span');
      const balloon = i % 2 === 0;
      el.className = 'fl' + (balloon ? ' balloon' : '');
      if (balloon) el.style.background = COLORS[i % 3 + 1 > 4 ? 1 : (i % 3) + 1]; else el.textContent = '❤';
      el.style.cssText += `left:${Math.random() * 95}%;animation-duration:${9 + Math.random() * 8}s;animation-delay:${Math.random() * 8}s;color:var(--pink)`;
      floaters.appendChild(el);
    }
  }

  /* ---------- Scroll reveals ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.id === 'paper') $$('.line', e.target).forEach((l, i) => l.style.transitionDelay = i * 0.9 + 's');
      if (e.target.id === 'finale') runFinale();
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 }) : null;
  const observe = (el) => io ? io.observe(el) : el.classList.add('in');

  /* ---------- Intro ---------- */
  let entered = false;
  const enter = () => {
    if (entered) return; entered = true;
    $('#intro').classList.add('gone');
    document.body.classList.remove('locked');
    $('#main').hidden = false;
    $('#main').classList.add('show');
    $('#hero').classList.add('show');
    $$('.reveal, #paper').forEach(observe);
    observe($('#finale'));
    setTimeout(() => { $('#intro').hidden = true; fireworks(3); }, 1100);
  };
  $('#openBtn').addEventListener('click', (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    $('#gift1').classList.add('open');
    const r = $('#gift1').getBoundingClientRect();
    setTimeout(() => { confetti(r.left + r.width / 2, r.top + 30); $('#flash').classList.add('go'); }, reduce ? 0 : 600);
    setTimeout(enter, reduce ? 200 : 1700);
  });
  $('#skipBtn').addEventListener('click', enter);

  /* ---------- Smooth scroll ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-scroll]');
    if (!a) return;
    e.preventDefault();
    $(a.getAttribute('href')).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Cake ---------- */
  const cakeWrap = $('#cakeWrap'), wishBtn = $('#wishBtn'), wishMsg = $('#wishMsg');
  let wishing = false;
  wishBtn.addEventListener('click', () => {
    if (wishing) return;
    if (cakeWrap.classList.contains('out')) { // replay: relight
      cakeWrap.classList.remove('out'); wishMsg.classList.remove('in'); wishBtn.textContent = 'MAKE A WISH ✨'; return;
    }
    wishing = true; wishBtn.disabled = true;
    cakeWrap.classList.add('out');
    const r = cakeWrap.getBoundingClientRect();
    setTimeout(() => { confetti(r.left + r.width / 2, r.top); wishMsg.classList.add('in'); }, 500);
    setTimeout(() => { wishing = false; wishBtn.disabled = false; wishBtn.textContent = 'RELIGHT THE CANDLES 🕯️'; }, 1800);
  });

  /* ---------- Secret gift + modal ---------- */
  const modal = $('#modal'), gift2 = $('#gift2');
  let lastFocus = null;
  const openModal = (m) => { lastFocus = document.activeElement; m.hidden = false; $('.btn', m).focus(); };
  const closeOverlay = (m) => { m.hidden = true; lastFocus && lastFocus.focus(); };
  gift2.addEventListener('click', () => {
    if (gift2.classList.contains('open')) return;
    gift2.classList.add('open');
    const r = gift2.getBoundingClientRect();
    goldHearts(r.left + r.width / 2, r.top + 20);
    setTimeout(() => openModal(modal), reduce ? 0 : 1100);
  });
  $('#closeModal').addEventListener('click', () => {
    closeOverlay(modal); gift2.classList.remove('open');
    $('#gallery').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Gallery + lightbox ---------- */
  const lb = $('#lightbox'), lbContent = $('#lbContent');
  const placeholder = () => { const d = document.createElement('div'); d.className = 'ph'; d.textContent = '📷'; d.setAttribute('role', 'img'); d.setAttribute('aria-label', 'Photo placeholder'); return d; };
  $$('.card img').forEach(img => {
    const swap = () => img.replaceWith(placeholder());
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap();
  });
  $$('.card').forEach(card => {
    card.tabIndex = 0; card.setAttribute('role', 'button');
    const open = () => {
      const img = $('img', card);
      lbContent.replaceChildren(img ? img.cloneNode() : placeholder());
      openModal(lb);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $('#closeLb').addEventListener('click', () => closeOverlay(lb));
  [modal, lb].forEach(m => m.addEventListener('click', e => { if (e.target === m) closeOverlay(m); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') [modal, lb].forEach(m => !m.hidden && closeOverlay(m)); });

  /* ---------- Finale ---------- */
  const finaleLines = $$('#finale .f');
  let finaleTimers = [];
  const runFinale = () => {
    finaleTimers.forEach(clearTimeout); finaleTimers = [];
    finaleLines.forEach(l => { l.classList.remove('in'); void l.offsetWidth; });
    finaleLines.forEach((l, i) => finaleTimers.push(setTimeout(() => l.classList.add('in'), i * 1200)));
    finaleTimers.push(setTimeout(() => { fireworks(7); confetti(W / 2, H / 3); }, 1200));
  };
  $('#againBtn').addEventListener('click', runFinale);

  /* ---------- Music ---------- */
  const musicBtn = $('#musicBtn');
  const audio = new Audio('music/birthday-song.mp3');
  audio.loop = true; audio.preload = 'none';
  let audioOk = true;
  audio.addEventListener('error', () => { audioOk = false; setMusic(false); });
  const setMusic = (on) => { musicBtn.setAttribute('aria-pressed', on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); };
  musicBtn.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); setMusic(false); return; }
    try { await audio.play(); setMusic(true); }
    catch { setMusic(false); toast('Music file not found. Add music/birthday-song.mp3'); }
  });

  /* ---------- Share ---------- */
  $('#shareBtn').addEventListener('click', async () => {
    const data = { title: 'Happy Birthday Swoccho!', text: 'A little birthday surprise 🎂', url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); toast('Shared!'); }
      else if (navigator.clipboard && location.protocol !== 'file:') { await navigator.clipboard.writeText(location.href); toast('Link copied to clipboard!'); }
      else toast('Publish the site online first, then share its link.');
    } catch (err) { if (err.name !== 'AbortError') toast('Sharing failed. Please copy the URL manually.'); }
  });

  /* ---------- Back to top ---------- */
  const topBtn = $('#topBtn');
  addEventListener('scroll', () => { topBtn.hidden = scrollY < innerHeight; }, { passive: true });
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
