/* Энциклопедия музыкантов: поиск, фильтр по инструменту, алфавит */
(() => {
  'use strict';

  // [фамилия, имя, инструмент, годы, ссылка на биографию на radiojazzfm.ru (если есть)]
  const BASE = 'https://radiojazzfm.ru/news/';
  const DATA = [
    ['Адамс', 'Пеппер', 'Саксофон', '1930–1986', 'pepper-adams'],
    ['Армстронг', 'Луи', 'Труба', '1901–1971'],
    ['Бейкер', 'Чет', 'Труба', '1929–1988'],
    ['Бейси', 'Каунт', 'Фортепиано', '1904–1984'],
    ['Блейки', 'Арт', 'Ударные', '1919–1990'],
    ['Бриль', 'Игорь', 'Фортепиано', 'р. 1944'],
    ['Бутман', 'Игорь', 'Саксофон', 'р. 1961'],
    ['Воан', 'Сара', 'Вокал', '1924–1990'],
    ['Гершвин', 'Джордж', 'Композитор', '1898–1937', 'dzhordzh-gershvin'],
    ['Гиллеспи', 'Диззи', 'Труба', '1917–1993', 'local:article.html'],
    ['Гудмен', 'Бенни', 'Кларнет', '1909–1986'],
    ['Дэвис', 'Майлз', 'Труба', '1926–1991'],
    ['Жилин', 'Сергей', 'Фортепиано', 'р. 1966', 'sergeyu-zhilinu'],
    ['Колтрейн', 'Джон', 'Саксофон', '1926–1967'],
    ['Коул', 'Нэт Кинг', 'Вокал', '1919–1965'],
    ['Крамер', 'Даниил', 'Фортепиано', 'р. 1960'],
    ['Лундстрем', 'Олег', 'Композитор', '1916–2005'],
    ['Марсалис', 'Уинтон', 'Труба', 'р. 1961', 'uinton-marsalis'],
    ['Мингус', 'Чарльз', 'Контрабас', '1922–1979'],
    ['Монк', 'Телониус', 'Фортепиано', '1917–1982'],
    ['Мэтини', 'Пэт', 'Гитара', 'р. 1954'],
    ['Паркер', 'Чарли', 'Саксофон', '1920–1955'],
    ['Пауэлл', 'Бад', 'Фортепиано', '1924–1966', 'bad-pauell'],
    ['Петтифорд', 'Оскар', 'Контрабас', '1922–1960', 'oskar-pettiford'],
    ['Рейнхардт', 'Джанго', 'Гитара', '1910–1953'],
    ['Роллинз', 'Сонни', 'Саксофон', 'р. 1930'],
    ['Симон', 'Нина', 'Вокал', '1933–2003'],
    ['Утёсов', 'Леонид', 'Вокал', '1895–1982'],
    ['Фицджеральд', 'Элла', 'Вокал', '1917–1996'],
    ['Хэнкок', 'Херби', 'Фортепиано', 'р. 1940'],
    ['Холидей', 'Билли', 'Вокал', '1915–1959'],
    ['Чарльз', 'Рэй', 'Фортепиано', '1930–2004', 'rey-charlz-tragediya-zhizni-obernuvshayasya-chudom'],
    ['Эванс', 'Билл', 'Фортепиано', '1929–1980'],
    ['Эйленкриг', 'Вадим', 'Труба', 'р. 1971'],
    ['Эллингтон', 'Дюк', 'Композитор', '1899–1974'],
  ];

  const COLORS = {
    'Труба': ['#0e3f9a', '#e6a92b'],
    'Саксофон': ['#c9a24a', '#15100c'],
    'Фортепиано': ['#15100c', '#c4402a'],
    'Вокал': ['#c4402a', '#efe4cf'],
    'Контрабас': ['#2b6f6a', '#e6a92b'],
    'Ударные': ['#e6a92b', '#0e3f9a'],
    'Гитара': ['#2b6f6a', '#c4402a'],
    'Кларнет': ['#0e3f9a', '#efe4cf'],
    'Композитор': ['#3a2e22', '#c9a24a'],
  };

  const grid = document.getElementById('encGrid');
  const count = document.getElementById('encCount');
  const search = document.getElementById('encSearch');
  const instBox = document.getElementById('encInst');
  const abcBox = document.getElementById('encAbc');
  if (!grid) return;

  const people = DATA.map(([last, first, inst, years, link]) => ({ last, first, inst, years, link, letter: last[0].toUpperCase() }))
    .sort((a, b) => a.last.localeCompare(b.last, 'ru'));
  const filter = { q: '', inst: 'all', letter: null };

  // инструменты
  const insts = ['all', ...Array.from(new Set(people.map((p) => p.inst))).sort((a, b) => a.localeCompare(b, 'ru'))];
  insts.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.inst = name;
    b.setAttribute('aria-pressed', String(name === 'all'));
    b.textContent = name === 'all' ? 'Все' : name;
    const sm = document.createElement('small');
    sm.textContent = name === 'all' ? people.length : people.filter((p) => p.inst === name).length;
    b.append(' ', sm);
    b.addEventListener('click', () => {
      filter.inst = name;
      Array.from(instBox.children).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    instBox.appendChild(b);
  });

  // алфавит
  const ABC = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ'.split('');
  const present = new Set(people.map((p) => p.letter));
  ABC.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Фамилии на букву ' + l);
    if (!present.has(l)) b.disabled = true;
    b.addEventListener('click', () => {
      filter.letter = filter.letter === l ? null : l;
      Array.from(abcBox.children).forEach((x) => x.setAttribute('aria-pressed', String(x.textContent === filter.letter)));
      render();
    });
    abcBox.appendChild(b);
  });

  search.addEventListener('input', () => {
    filter.q = search.value.trim().toLowerCase();
    render();
  });

  const plural = (n) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'музыкант';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'музыканта';
    return 'музыкантов';
  };

  function card(p, i) {
    const href = p.link ? (p.link.startsWith('local:') ? p.link.slice(6) : BASE + p.link) : null;
    const el = document.createElement(href ? 'a' : 'div');
    el.className = 'mus';
    if (href) el.href = href;
    const [bg, accent] = COLORS[p.inst] || ['#3a2e22', '#c9a24a'];

    const art = document.createElement('div');
    art.className = 'mus__art';
    art.style.background = bg;
    art.setAttribute('aria-hidden', 'true');
    const shape = document.createElement('span');
    shape.className = 'mus__shape';
    shape.style.background = accent;
    if (i % 3 === 1) { shape.style.borderRadius = '0'; shape.style.transform = 'rotate(18deg)'; }
    if (i % 3 === 2) { shape.style.background = 'transparent'; shape.style.border = '9cqw solid ' + accent; }
    const letter = document.createElement('span');
    letter.className = 'mus__l';
    letter.textContent = p.letter;
    const inst = document.createElement('span');
    inst.className = 'mus__inst';
    inst.textContent = p.inst;
    art.append(shape, letter, inst);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'mus__body';
    const name = document.createElement('h2');
    name.className = 'mus__name';
    name.textContent = p.first + ' ' + p.last;
    const years = document.createElement('span');
    years.className = 'mus__years';
    years.textContent = p.years;
    const more = document.createElement('span');
    more.className = 'mus__more' + (href ? '' : ' mus__more--soon');
    more.textContent = href ? 'Читать →' : 'Материал скоро';
    bodyEl.append(name, years, more);

    el.append(art, bodyEl);
    return el;
  }

  function render() {
    const list = people.filter((p) =>
      (filter.inst === 'all' || p.inst === filter.inst) &&
      (!filter.letter || p.letter === filter.letter) &&
      (!filter.q || (p.first + ' ' + p.last + ' ' + p.inst).toLowerCase().includes(filter.q)));
    grid.textContent = '';
    list.forEach((p, i) => grid.appendChild(card(p, i)));
    if (!list.length) {
      const e = document.createElement('p');
      e.className = 'enc-empty';
      e.textContent = 'Никого не нашли. Попробуй другую букву или инструмент.';
      grid.appendChild(e);
    }
    count.textContent = list.length + ' ' + plural(list.length);
  }
  render();
})();
