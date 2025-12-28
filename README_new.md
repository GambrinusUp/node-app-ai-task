# Node Application

Фотогалерея на NodeJS

## Стек технологий

- NodeJS (веб-фреймворк Express)

- MySQL

## Локальный запуск

*примеры команд ниже указаны для unix-подобных ОС, с виндой разбирайтесь сами*

1. Ставим БД MySQL (любой версии) для своей ОС ([тык](https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/)), запускаем и проверяем работоспособность

2. Устанавливаем [npm и nodejs](https://nodejs.org/en/download/)

3. ... или ставим триалку WebStorm, которая сама поставит всё необходимое

4. Меняем креды в файле `db.js`, чтобы они соответствовали вашим

5. Загоняем в БД скрипт `init.sql` для создания таблиц по умолчанию

6. Ставим зависимости командой

```bash
npm install
```

7. Запускаем приложение командой

```bash
npm start
```

## Дополнительно

API доступен по адресу http://localhost:3000

[Документация Postman](https://www.getpostman.com/collections/87776fd4abf2af4bdb6d)

---

## Архитектура приложения

- Веб-сервер: Express (файл: [app.js](app.js)).
- Маршруты: [routes/index.js](routes/index.js) реализует основные эндпоинты — рендер главной страницы, загрузка изображений и получение списка.
- Хранение данных: MySQL через модуль `mysql2` (конфигурация в [db.js](db.js)).
- Файлы изображений сохраняются в каталоге `public/images/` — имена формируются через `uuid`.
- Шаблоны: Pug (папка [views](views)).
- Middleware: `express-form-data` для обработки загрузок, `cors`, `morgan`, `cookie-parser` и статические файлы в `public/`.

Компоненты взаимодействуют так: HTTP -> Express -> маршруты -> (запись файла в `public/images/` + INSERT в БД) -> ответ клиенту.

## Запуск тестов

Unit и integration тесты настроены через `mocha`/`chai`/`sinon` и находятся в папке `test/`.

- Установите зависимости и запустите все тесты:

```bash
npm install
npm test
```

- Тесты в режиме watch:

```bash
npm run test:watch
```

- Нагрузочные тесты:
  - Autocannon (скрипт): `npm run load-test` — сценарий в `load-tests/autocannon-test.js`, результаты в `load-tests/results/`.
  - Artillery: `npm run load-test:artillery` (config: `load-tests/artillery-config.yml`).
  - K6: `k6 run load-tests/k6-test.js` (если установлен).

## API (эндпоинты)

1. GET /
   - Описание: Главная страница (рендер `index.pug`).
   - Ответ: HTML.

2. POST /new
   - Описание: Загрузка изображения (multipart/form-data).
   - Поля: `image` (файл, обязательное), `name`, `description`, `author`.
   - Поведение: Сохраняет файл в `public/images/`, добавляет запись в таблицу `data` и возвращает имя файла.
   - Коды: `200` (OK, возвращает имя файла), `400` (image required), `500` (ошибка сервера).

3. GET /all
   - Описание: Возвращает все записи из таблицы `data`.
   - Ответ: JSON массив; коды: `200`, `500`.

---

Если хотите, добавлю примеры `curl` или импортируемую коллекцию Postman в репозиторий.
