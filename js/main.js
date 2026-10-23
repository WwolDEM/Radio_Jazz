/* Radio JAZZ — концепт редизайна. Плеер демонстрационный: эфир не транслируется. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Слоты под картинки: нет файла — убираем, есть — прячем заглушку ---------- */
  $$('img[data-slot]').forEach((img) => {
    const host = img.closest('.slot');
    const ok = () => host && host.classList.add('has-img');
    const fail = () => img.remove();
    if (img.complete) {
      img.naturalWidth ? ok() : fail();
    } else {
      img.addEventListener('load', ok, { once: true });
      img.addEventListener('error', fail, { once: true });
    }
  });

  /* ---------- Бегущая строка: джазовый факт дня ---------- */
  const FACTS = [
    '1 октября 1922 года Валентин Парнах дал в Москве первый джазовый концерт — с тех пор это День российского джаза',
    'Международный день джаза отмечают 30 апреля — его учредила ЮНЕСКО',
    'Kind of Blue Майлза Дэвиса (1959) называют самым продаваемым джазовым альбомом в истории',
    'Альбом A Love Supreme Джона Колтрейна записан 9 декабря 1964 года',
    'Диззи Гиллеспи играл на трубе с раструбом, загнутым вверх',
    'Элла Фицджеральд получила 13 премий «Грэмми»',
    'Луи Армстронг записал What a Wonderful World в 1967 году',
  ];
  const run = $('#tickerRun');
  if (run) {
    const group = (hidden) => {
      const g = document.createElement('span');
      g.className = 'ticker__group';
      if (hidden) g.setAttribute('aria-hidden', 'true');
      FACTS.forEach((f) => {
        const s = document.createElement('span');
        s.className = 'fact';
        s.textContent = f;
        g.appendChild(s);
      });
      return g;
    };
    run.append(group(false), group(true));
    requestAnimationFrame(() => {
      const half = run.scrollWidth / 2;
      run.style.animationDuration = Math.max(40, Math.round(half / 70)) + 's';
    });
  }

  /* ---------- Данные эфира (демо) ---------- */
  const STREAMS = [
    {
      name: 'Jazz Legends',
      tracks: [['Dizzy Gillespie', 'A Night in Tunisia', 262], ['Miles Davis', 'So What', 330], ['John Coltrane', 'Naima', 261], ['Thelonious Monk', "'Round Midnight", 298]],
      history: [['Charlie Parker', 'Ornithology'], ['Art Blakey', 'Moanin\''], ['Bud Powell', 'Un Poco Loco']],
    },
    {
      name: 'Smooth Jazz',
      tracks: [['George Benson', "Breezin'", 340], ['Grover Washington Jr.', 'Winelight', 300], ['Bob James', 'Angela', 200]],
      history: [['David Sanborn', 'Chicago Song'], ['Spyro Gyra', 'Morning Dance'], ['Earl Klugh', 'Living Inside Your Love']],
    },
    {
      name: 'Jazz Vocals',
      tracks: [['Ella Fitzgerald', 'Summertime', 290], ['Sarah Vaughan', 'Misty', 180], ['Chet Baker', 'My Funny Valentine', 140]],
      history: [['Nina Simone', 'Feeling Good'], ['Nat King Cole', 'Unforgettable'], ['Billie Holiday', 'Lover Man']],
    },
    {
      name: 'Classic Jazz',
      tracks: [['Duke Ellington', 'Take the "A" Train', 175], ['Louis Armstrong', 'What a Wonderful World', 140], ['Count Basie', "One O'Clock Jump", 190]],
      history: [['Benny Goodman', 'Sing, Sing, Sing'], ['Glenn Miller', 'In the Mood'], ['Fats Waller', "Ain't Misbehavin'"]],
    },
  ];

  const body = document.body;
  const deck = $('#deck');
  const els = {
    artist: $('#ledArtist'),
    title: $('#ledTitle'),
    streamName: $('#streamName'),
    elapsed: $('#elapsed'),
    fill: $('#progressFill'),
    recent: $('#recent'),
    miniArtist: $('#miniArtist'),
    miniTitle: $('#miniTitle'),
    miniStream: $('#miniStream'),
  };
  const playBtns = $$('[data-play]');
  const streamBtns = $$('[data-stream]');

  const state = { playing: false, stream: 0, idx: 0, elapsed: 0 };
  const randStart = () => 20 + Math.floor(Math.random() * 70);
  state.elapsed = randStart();

  const current = () => {
    const list = STREAMS[state.stream].tracks;
    return list[state.idx % list.length];
  };
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const clock = (d) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  /* Табло: печатаем название по буквам */
  let typeTimer = null;
  function showTrack(animate) {
    const [artist, title] = current();
    const s = STREAMS[state.stream];
    els.streamName.textContent = s.name;
    els.miniStream.textContent = s.name;
    els.miniArtist.textContent = artist;
    els.miniTitle.textContent = title;
    clearInterval(typeTimer);
    if (!animate || reduceMotion) {
      els.artist.textContent = artist;
      els.title.textContent = title;
      return;
    }
    const full = artist + '\n' + title;
    let i = 0;
    els.artist.textContent = '';
    els.title.textContent = '';
    typeTimer = setInterval(() => {
      i += 1;
      const [a, t = ''] = full.slice(0, i).split('\n');
      els.artist.textContent = a;
      els.title.textContent = t;
      if (i >= full.length) clearInterval(typeTimer);
    }, 40);
  }

  function updateProgress() {
    const dur = current()[2];
    els.elapsed.textContent = fmt(state.elapsed);
    els.fill.style.width = Math.min(100, (state.elapsed / dur) * 100) + '%';
  }

  /* Недавно звучало */
  let recent = [];
  function seedRecent() {
    const now = Date.now();
    recent = STREAMS[state.stream].history.map(([artist, title], k) => ({
      artist, title, time: new Date(now - (k + 1) * 4.3 * 60000 - state.elapsed * 1000),
    }));
    renderRecent(false);
  }
  function renderRecent(withNew) {
    els.recent.textContent = '';
    recent.forEach((r, k) => {
      const li = document.createElement('li');
      if (withNew && k === 0) li.className = 'is-new';
      const s = document.createElement('span');
      s.textContent = r.artist + ' — ' + r.title;
      const t = document.createElement('time');
      t.textContent = clock(r.time);
      li.append(s, t);
      els.recent.appendChild(li);
    });
  }

  function nextTrack() {
    const [artist, title] = current();
    recent.unshift({ artist, title, time: new Date() });
    recent = recent.slice(0, 3);
    renderRecent(true);
    state.idx += 1;
    state.elapsed = 0;
    showTrack(true);
    updateProgress();
  }

  let tick = null;
  function startTick() {
    clearInterval(tick);
    tick = setInterval(() => {
      state.elapsed += 1;
      if (state.elapsed >= current()[2]) nextTrack();
      else updateProgress();
    }, 1000);
  }
  function stopTick() { clearInterval(tick); }

  /* ---------- Треск винила (генерируется в браузере, без файлов) ---------- */
  const crackle = (() => {
    let ctx = null;
    let gain = null;
    let src = null;
    let enabled = true;

    function build() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const sr = ctx.sampleRate;
      const len = sr * 5;
      const buf = ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < len; i++) {
        b = 0.97 * b + 0.03 * (Math.random() * 2 - 1);
        d[i] = b * 0.5;
      }
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.0004) {
          const amp = (0.15 + Math.random() * 0.45) * (Math.random() < 0.5 ? -1 : 1);
          const L = Math.floor(sr * (0.0006 + Math.random() * 0.0015));
          for (let j = 0; j < L && i + j < len; j++) d[i + j] += amp * (1 - j / L);
        }
      }
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 250;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 7000;
      gain = ctx.createGain();
      gain.gain.value = 0;
      hp.connect(lp).connect(gain).connect(ctx.destination);
      src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(hp);
      src.start();
      return true;
    }

    return {
      start() {
        if (!enabled) return;
        if (!ctx && !build()) return;
        ctx.resume();
        gain.gain.setTargetAtTime(0.28, ctx.currentTime, 0.4);
      },
      stop() {
        if (!ctx) return;
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      },
      set(on) {
        enabled = on;
        if (!on) this.stop();
        else if (state.playing) this.start();
      },
    };
  })();

  const crackleBtn = $('#crackle');
  crackleBtn.addEventListener('click', () => {
    const on = crackleBtn.getAttribute('aria-pressed') !== 'true';
    crackleBtn.setAttribute('aria-pressed', String(on));
    crackle.set(on);
  });

  /* ---------- Вращение пластинки + скретч ---------- */
  const record = $('#record');
  const platter = $('#platter');
  const SPEED = reduceMotion ? 0 : 198; // 33⅓ об/мин ≈ 200°/с
  const spin = { angle: 0, vel: 0, target: 0, drag: false, lastA: 0, lastT: 0 };
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!spin.drag) {
      spin.vel += (spin.target - spin.vel) * Math.min(1, dt * 1.6);
      if (Math.abs(spin.vel) < 0.05 && spin.target === 0) spin.vel = 0;
      spin.angle = (spin.angle + spin.vel * dt) % 360;
    }
    record.style.transform = 'rotate(' + spin.angle.toFixed(2) + 'deg)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const pointerAngle = (e) => {
    const r = platter.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };
  record.addEventListener('pointerdown', (e) => {
    spin.drag = true;
    spin.lastA = pointerAngle(e);
    spin.lastT = performance.now();
    spin.vel = 0;
    record.setPointerCapture(e.pointerId);
    record.classList.add('is-dragging');
  });
  record.addEventListener('pointermove', (e) => {
    if (!spin.drag) return;
    const a = pointerAngle(e);
    let d = a - spin.lastA;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    const t = performance.now();
    const dt = Math.max(0.008, (t - spin.lastT) / 1000);
    spin.angle += d;
    spin.vel = Math.max(-2400, Math.min(2400, spin.vel * 0.5 + (d / dt) * 0.5));
    spin.lastA = a;
    spin.lastT = t;
  });
  const endDrag = () => {
    if (!spin.drag) return;
    spin.drag = false;
    record.classList.remove('is-dragging');
  };
  record.addEventListener('pointerup', endDrag);
  record.addEventListener('pointercancel', endDrag);

  /* ---------- Play / Pause ---------- */
  let armTimer = null;
  function setPlaying(on) {
    state.playing = on;
    body.classList.toggle('is-playing', on);
    playBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Пауза' : 'Включить эфир');
    });
    spin.target = on ? SPEED : 0;
    clearTimeout(armTimer);
    if (on) {
      armTimer = setTimeout(() => deck.classList.add('is-on'), 250);
      showTrack(true);
      startTick();
      crackle.start();
    } else {
      deck.classList.remove('is-on');
      stopTick();
      crackle.stop();
    }
  }
  playBtns.forEach((b) => b.addEventListener('click', () => setPlaying(!state.playing)));

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'button', 'a', 'select'].includes(tag) || e.target.isContentEditable) return;
    if ($('#msgDialog').open) return;
    e.preventDefault();
    setPlaying(!state.playing);
  });

  /* ---------- Потоки ---------- */
  streamBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = Number(btn.dataset.stream);
      if (s === state.stream) return;
      state.stream = s;
      state.idx = 0;
      state.elapsed = randStart();
      streamBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
      seedRecent();
      showTrack(true);
      updateProgress();
    });
  });

  showTrack(false);
  updateProgress();
  seedRecent();

  /* ---------- Мини-плеер появляется, когда основной ушёл из вида ---------- */
  const mini = $('#mini');
  const playerMain = $('#playerMain');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      mini.classList.toggle('is-visible', past);
    }, { rootMargin: '-72px 0px 0px 0px' }).observe(playerMain);
  }

  /* ---------- Фильтр новостей ---------- */
  const grid = $('#newsGrid');
  const cards = $$('.card', grid);
  const chips = $$('[data-filter]');
  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === 'all' ? cards.length : cards.filter((c) => c.dataset.tag === f).length;
    $('small', chip).textContent = n;
    if (!n) chip.hidden = true;
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.tag === f); });
      grid.classList.toggle('is-filtered', f !== 'all');
    });
  });

  /* ---------- Бургер ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* ---------- Сообщение в эфир (демо) ---------- */
  const dlg = $('#msgDialog');
  const form = $('#msgForm');
  const done = $('#msgDone');
  $$('[data-open-message]').forEach((b) => b.addEventListener('click', () => {
    form.hidden = false;
    done.hidden = true;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    form.hidden = true;
    done.hidden = false;
  });
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
