/* Radio JAZZ — концепт редизайна. Плеер демонстрационный: эфир не транслируется.
   Один скрипт на все страницы: каждый блок проверяет, есть ли нужные элементы. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const setText = (el, v) => { if (el) el.textContent = v; };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* приватный режим */ } },
  };

  /* ---------- Заставка: один раз за сессию ---------- */
  const loader = $('#loader');
  if (loader) {
    if (store.get('rj-intro') || reduceMotion) {
      loader.remove();
    } else {
      store.set('rj-intro', '1');
      const started = performance.now();
      const hide = () => {
        const wait = Math.max(0, 1500 - (performance.now() - started));
        setTimeout(() => {
          loader.classList.add('is-done');
          setTimeout(() => loader.remove(), 700);
        }, wait);
      };
      if (document.readyState === 'complete') hide();
      else window.addEventListener('load', hide, { once: true });
    }
  }

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

  /* ---------- Тост ---------- */
  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1800);
  }

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
      run.style.animationDuration = Math.max(40, Math.round(run.scrollWidth / 2 / 70)) + 's';
    });
  }

  /* ---------- Данные эфира (демо) ---------- */
  const STREAMS = [
    {
      name: 'Jazz Legends',
      tracks: [['Dizzy Gillespie', 'A Night in Tunisia', 262], ['Miles Davis', 'So What', 330], ['John Coltrane', 'Naima', 261], ['Thelonious Monk', "'Round Midnight", 298]],
      history: [['Charlie Parker', 'Ornithology'], ['Art Blakey', "Moanin'"], ['Bud Powell', 'Un Poco Loco']],
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
  const trackBtns = $$('[data-track]');

  const state = { playing: false, stream: 0, idx: 0, elapsed: 0, custom: null };
  const randStart = () => 20 + Math.floor(Math.random() * 70);
  state.elapsed = randStart();

  const current = () => {
    if (state.custom) return state.custom;
    const list = STREAMS[state.stream].tracks;
    return list[state.idx % list.length];
  };
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const clock = (d) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  /* Табло: печатаем название по буквам */
  let typeTimer = null;
  function showTrack(animate) {
    const [artist, title] = current();
    const label = state.custom ? 'Из статьи' : STREAMS[state.stream].name;
    setText(els.streamName, label);
    setText(els.miniStream, label);
    setText(els.miniArtist, artist);
    setText(els.miniTitle, title);
    syncTrackBtns();
    if (!els.artist) return;
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
    if (!els.elapsed) return;
    const dur = current()[2];
    els.elapsed.textContent = fmt(state.elapsed);
    els.fill.style.width = Math.min(100, (state.elapsed / dur) * 100) + '%';
  }

  /* Недавно звучало */
  let recent = [];
  function renderRecent(withNew) {
    if (!els.recent) return;
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
  function seedRecent() {
    const now = Date.now();
    recent = STREAMS[state.stream].history.map(([artist, title], k) => ({
      artist, title, time: new Date(now - (k + 1) * 4.3 * 60000 - state.elapsed * 1000),
    }));
    renderRecent(false);
  }

  function nextTrack() {
    const [artist, title] = current();
    recent.unshift({ artist, title, time: new Date() });
    recent = recent.slice(0, 3);
    renderRecent(true);
    if (state.custom) state.custom = null;
    else state.idx += 1;
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
      const src = ctx.createBufferSource();
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
  if (crackleBtn) {
    crackleBtn.addEventListener('click', () => {
      const on = crackleBtn.getAttribute('aria-pressed') !== 'true';
      crackleBtn.setAttribute('aria-pressed', String(on));
      crackle.set(on);
    });
  }

  /* ---------- Вращение пластинки + скретч ---------- */
  const record = $('#record');
  const platter = $('#platter');
  const SPEED = reduceMotion ? 0 : 198; // 33⅓ об/мин ≈ 200°/с
  const spin = { angle: 0, vel: 0, target: 0, drag: false, lastA: 0, lastT: 0 };

  if (record && platter) {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!spin.drag) {
        spin.vel += (spin.target - spin.vel) * Math.min(1, dt * 1.6);
        if (Math.abs(spin.vel) < 0.05 && spin.target === 0) spin.vel = 0;
        spin.angle = (spin.angle + spin.vel * dt) % 360;
      }
      record.style.transform = 'rotate(' + spin.angle.toFixed(2) + 'deg)';
      requestAnimationFrame(frame);
    };
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
  }

  /* ---------- VU-метры ---------- */
  const vuEls = $$('[data-vu]');
  const vus = [];
  if (vuEls.length) {
    const NS = 'http://www.w3.org/2000/svg';
    const CX = 100;
    const CY = 128;
    const MARKS = [[-20, -48], [-10, -30], [-7, -19], [-5, -9], [-3, 2], [0, 22], [3, 44]];
    const el = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (parent) parent.appendChild(n);
      return n;
    };
    const pt = (deg, r) => {
      const a = (deg - 90) * Math.PI / 180;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    };
    vuEls.forEach((host, n) => {
      const svg = el('svg', { viewBox: '0 0 200 116', role: 'presentation' });
      const defs = el('defs', {}, svg);
      const grad = el('radialGradient', { id: 'vuFace' + n, cx: '50%', cy: '70%', r: '75%' }, defs);
      el('stop', { offset: '0%', 'stop-color': '#fbf1d8' }, grad);
      el('stop', { offset: '70%', 'stop-color': '#ead9b3' }, grad);
      el('stop', { offset: '100%', 'stop-color': '#c9b48a' }, grad);
      const face = el('g', { class: 'vu__face' }, svg);
      el('rect', { x: 0, y: 0, width: 200, height: 116, fill: 'url(#vuFace' + n + ')' }, face);
      // красная зона
      const [rx1, ry1] = pt(22, 92);
      const [rx2, ry2] = pt(50, 92);
      el('path', { d: `M${rx1} ${ry1} A92 92 0 0 1 ${rx2} ${ry2}`, stroke: '#c4402a', 'stroke-width': 5, fill: 'none' }, face);
      const [ax1, ay1] = pt(-50, 92);
      el('path', { d: `M${ax1} ${ay1} A92 92 0 0 1 ${rx1} ${ry1}`, stroke: '#15100c', 'stroke-width': 1.4, fill: 'none' }, face);
      for (let d = -50; d <= 50; d += 5) {
        const major = MARKS.some((m) => m[1] === d) || d % 10 === 0;
        const [x1, y1] = pt(d, 92);
        const [x2, y2] = pt(d, major ? 82 : 87);
        el('line', { x1, y1, x2, y2, stroke: d >= 22 ? '#c4402a' : '#15100c', 'stroke-width': major ? 1.6 : 1 }, face);
      }
      MARKS.forEach(([label, d]) => {
        const [x, y] = pt(d, 71);
        const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'Oswald, sans-serif', fill: label >= 0 ? '#c4402a' : '#15100c' }, face);
        t.textContent = label > 0 ? '+' + label : String(label);
      });
      const vu = el('text', { x: CX, y: 100, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, 'font-family': 'Oswald, sans-serif', fill: '#15100c', 'letter-spacing': 2 }, face);
      vu.textContent = 'VU';
      const side = el('text', { x: 12, y: 108, 'font-size': 9, 'font-family': 'Oswald, sans-serif', fill: '#5a4d3d', 'letter-spacing': 1 }, face);
      side.textContent = host.dataset.vu;
      const needle = el('g', { class: 'needle' }, svg);
      el('line', { x1: CX, y1: CY, x2: CX, y2: 26, stroke: '#15100c', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, needle);
      el('path', { d: 'M0 0 H200 V30 Q100 52 0 30 Z', fill: '#ffffff', opacity: 0.12 }, svg); // блик стекла
      host.appendChild(svg);
      vus.push({ needle, angle: -52, vel: 0, target: -52, seed: Math.random() * 100 });
    });

    let lastV = performance.now();
    const vuFrame = (now) => {
      const dt = Math.min(0.05, (now - lastV) / 1000);
      lastV = now;
      const t = now / 1000;
      vus.forEach((v, i) => {
        if (state.playing) {
          // «музыка»: медленная волна + быстрые всплески
          const base = 0.55 + 0.18 * Math.sin(t * 1.3 + v.seed) + 0.1 * Math.sin(t * 3.7 + i);
          const peak = Math.random() < 0.06 ? Math.random() * 0.35 : 0;
          const lvl = Math.max(0, Math.min(1.05, base + peak + (Math.random() - 0.5) * 0.12));
          v.target = -50 + lvl * 96;
        } else {
          v.target = -52;
        }
        // пружина: стрелка с инерцией, как у настоящего прибора
        const k = 60;
        const c = 11;
        v.vel += (k * (v.target - v.angle) - c * v.vel) * dt;
        v.angle += v.vel * dt;
        v.needle.setAttribute('transform', 'rotate(' + v.angle.toFixed(2) + ' ' + CX + ' ' + CY + ')');
      });
      requestAnimationFrame(vuFrame);
    };
    requestAnimationFrame(vuFrame);
  }

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
      if (deck) armTimer = setTimeout(() => deck.classList.add('is-on'), 250);
      showTrack(true);
      startTick();
      crackle.start();
    } else {
      if (deck) deck.classList.remove('is-on');
      stopTick();
      crackle.stop();
    }
    syncTrackBtns();
  }
  playBtns.forEach((b) => b.addEventListener('click', () => setPlaying(!state.playing)));

  /* Треки из статьи */
  function syncTrackBtns() {
    trackBtns.forEach((b) => {
      const [a, t] = b.dataset.track.split('|');
      const isCur = !!state.custom && state.custom[0] === a && state.custom[1] === t;
      b.setAttribute('aria-pressed', String(isCur && state.playing));
    });
  }
  trackBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const [a, t, d] = b.dataset.track.split('|');
      const isCur = !!state.custom && state.custom[0] === a && state.custom[1] === t;
      if (isCur) { setPlaying(!state.playing); return; }
      state.custom = [a, t, Number(d) || 240];
      state.elapsed = 0;
      updateProgress();
      showTrack(true);
      if (!state.playing) setPlaying(true);
      else syncTrackBtns();
      if (mini) mini.classList.add('is-visible');
    });
  });

  /* ---------- Потоки ---------- */
  streamBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = Number(btn.dataset.stream);
      if (s === state.stream && !state.custom) return;
      state.stream = s;
      state.custom = null;
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

  /* ---------- Мини-плеер ---------- */
  const mini = $('#mini');
  const playerMain = $('#playerMain');
  if (mini) {
    if (playerMain && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        mini.classList.toggle('is-visible', past);
      }, { rootMargin: '-72px 0px 0px 0px' }).observe(playerMain);
    } else if (!playerMain) {
      mini.classList.add('is-visible'); // на внутренних страницах плеер всегда под рукой
    }
  }

  /* ---------- Клавиатура: пробел = play, «jazz» / «джаз» = скретч ---------- */
  let typed = '';
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const inField = ['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable;
    const dlgOpen = $('#msgDialog') && $('#msgDialog').open;
    if (inField || dlgOpen) return;
    if (e.code === 'Space' && !e.repeat && !['button', 'a'].includes(tag)) {
      e.preventDefault();
      setPlaying(!state.playing);
      return;
    }
    if (e.key && e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-6);
      if (typed.endsWith('jazz') || typed.endsWith('джаз')) {
        easterEgg();
        typed = '';
      }
    }
  });
  function easterEgg() {
    if (record) {
      spin.vel = -2200; // назад, как скретч
      setTimeout(() => { spin.vel = 1800; }, 260);
    }
    toast('♪ SCRATCH! ♪');
  }

  /* ---------- Программа эфира (условная) ---------- */
  const PROGRAM = [
    [0, 'Ночной джаз', 'Нон-стоп'],
    [3, 'Джаз до рассвета', 'Баллады'],
    [6, 'Утренний кофе', 'Smooth Jazz'],
    [10, 'Jazz Legends', 'Классика жанра'],
    [13, 'Игры в джаз', 'Программа'],
    [15, 'Эра святого саксофона', 'Программа'],
    [17, 'Доктор на Джазе', 'Программа'],
    [19, 'Джазовая лаборатория', 'Даниил Крамер'],
    [21, 'Вечерний джайв', 'Программа'],
    [23, 'Эпоха великого экспериментатора', 'Программа'],
  ];
  const schedList = $('#schedList');
  const sched = $('#sched');
  if (schedList && sched) {
    const PX = window.matchMedia('(max-width: 560px)').matches ? 100 : 130; // пикселей на час
    const hours = document.createElement('div');
    hours.className = 'sched__hours';
    hours.setAttribute('aria-hidden', 'true');
    for (let h = 0; h < 24; h++) {
      const s = document.createElement('span');
      s.style.width = PX + 'px';
      s.textContent = String(h).padStart(2, '0') + ':00';
      hours.appendChild(s);
    }
    schedList.appendChild(hours);
    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    PROGRAM.forEach(([start, title, kind], i) => {
      const end = i + 1 < PROGRAM.length ? PROGRAM[i + 1][0] : 24;
      const li = document.createElement('li');
      li.className = 'prog';
      li.style.width = (end - start) * PX + 'px';
      const time = document.createElement('span');
      time.className = 'prog__time';
      time.textContent = String(start).padStart(2, '0') + ':00 — ' + String(end % 24).padStart(2, '0') + ':00';
      const h = document.createElement('h3');
      h.className = 'prog__title';
      h.textContent = title;
      const k = document.createElement('span');
      k.className = 'prog__kind';
      k.textContent = kind;
      li.append(time, h, k);
      if (nowH >= end) li.classList.add('is-past');
      if (nowH >= start && nowH < end) {
        li.classList.add('is-now');
        li.setAttribute('aria-current', 'true');
        const badge = document.createElement('span');
        badge.className = 'prog__badge';
        badge.textContent = 'В эфире';
        const fill = document.createElement('span');
        fill.className = 'prog__fill';
        fill.style.width = ((nowH - start) / (end - start)) * 100 + '%';
        li.append(badge, fill);
      }
      schedList.appendChild(li);
    });
    const line = document.createElement('div');
    line.className = 'sched__now';
    line.style.left = nowH * PX + 'px';
    line.setAttribute('aria-hidden', 'true');
    schedList.appendChild(line);
    requestAnimationFrame(() => {
      sched.style.scrollBehavior = 'auto';
      sched.scrollLeft = Math.max(0, nowH * PX - sched.clientWidth * 0.3);
      sched.style.scrollBehavior = '';
    });
    $$('[data-sched]').forEach((b) => b.addEventListener('click', () => {
      sched.scrollBy({ left: Number(b.dataset.sched) * sched.clientWidth * 0.7, behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }

  /* ---------- Фильтр новостей ---------- */
  const grid = $('#newsGrid');
  if (grid) {
    const cards = $$('.card', grid);
    const chips = $$('[data-filter]');
    chips.forEach((chip) => {
      const f = chip.dataset.filter;
      const n = f === 'all' ? cards.length : cards.filter((c) => c.dataset.tag === f).length;
      setText($('small', chip), n);
      if (!n) chip.hidden = true;
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.tag === f); });
        grid.classList.toggle('is-filtered', f !== 'all');
      });
    });
  }

  /* ---------- Бургер ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  if (burger && nav) {
    const setNav = (open) => {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  }

  /* ---------- Сообщение в эфир (демо) ---------- */
  const dlg = $('#msgDialog');
  if (dlg) {
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
  }
})();
