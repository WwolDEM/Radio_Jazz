# Radio JAZZ — концепт редизайна

Неофициальный демо-концепт сайта Радио JAZZ 89.1 FM. Дизайн и вёрстка — WwolDEM.
Бренд и материалы принадлежат Радио JAZZ / Мультимедиа Холдинг. Плеер демонстрационный: эфир не транслируется.

## Что внутри

```
index.html          — страница
css/style.css       — стили
css/fonts.css       — локальные шрифты (Monoton, Oswald, DotGothic16, Golos Text — OFL)
js/main.js          — интерактив
assets/img/         — вырезанные картинки (WebP)
assets/fonts/       — файлы шрифтов
```

Сборка не нужна: чистые HTML, CSS и JS.

## Фишки

- Play: пластинка разгоняется, игла опускается, табло печатает трек по буквам, тихо трещит винил (звук генерируется в браузере).
- Пластинку можно крутить мышкой или пальцем (скретч).
- Пробел — play/pause.
- Четыре потока со своими треками; по окончании трека он уходит в «Недавно звучало».
- Обложки релизов: при наведении пластинка выезжает из конверта.
- Бегущая строка «Факт дня» в стиле LED-табло.
- Фильтр новостей по рубрикам.
- Мини-плеер появляется внизу, когда прокручиваешь ниже основного.
- Окно «Сообщение в эфир» (демо, ничего не отправляет).

## Как выложить на GitHub Pages

1. github.com → **New repository** → имя, например `radio-jazz-concept` → Public → **Create repository**.
2. На странице репозитория: **uploading an existing file** → перетащи **содержимое** папки (index.html, css, js, assets, README.md — не саму папку) → **Commit changes**.
3. **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, папка **/ (root)** → **Save**.
4. Через 1–2 минуты сайт откроется по адресу `https://<твой-логин>.github.io/radio-jazz-concept/`.

Через терминал:

```bash
cd radiojazz
git init && git add . && git commit -m "Radio JAZZ concept"
git branch -M main
git remote add origin https://github.com/<логин>/radio-jazz-concept.git
git push -u origin main
```

Потом шаг 3.
