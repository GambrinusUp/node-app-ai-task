# PhotoGallery Application Tests

Comprehensive unit и integration тесты для приложения PhotoGallery.

## Структура тестов

```
test/
├── routes.test.js      # Unit тесты для маршрутов
├── db.test.js          # Unit тесты для базы данных
├── app.test.js         # Integration тесты приложения
└── utils.test.js       # Тесты утилит
```

## Установка зависимостей

```bash
npm install
```

## Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить тесты в режиме watch
npm run test:watch
```

## Охватываемые области тестирования

### Routes Tests (`routes.test.js`)

- **GET /** - проверка отображения главной страницы
  - ✅ Рендеринг с корректными данными (title, version)
  
- **POST /new** - загрузка изображений
  - ✅ Валидация наличия изображения
  - ✅ Успешная обработка загрузки
  - ✅ Обработка ошибок базы данных
  - ✅ Генерация UUID для имен файлов
  
- **GET /all** - получение всех изображений
  - ✅ Возврат списка изображений из БД
  - ✅ Обработка ошибок БД
  - ✅ Правильный SQL запрос

### Database Tests (`db.test.js`)

- Проверка создания соединения с MySQL
- Валидация учетных данных (host, user, password, database)
- Экспорт объекта connection
- Проверка наличия метода query

### App Integration Tests (`app.test.js`)

- HTTP статус коды (200, 404, 500)
- CORS заголовки
- Обработка ошибок
- Интеграция маршрутов с Express приложением

### Utils Tests (`utils.test.js`)

- UUID генерация и уникальность
- Работа с файловой системой
- Express Router функциональность
- Stream операции

## Используемые фреймворки

- **Mocha** - test runner
- **Chai** - assertion library
- **Sinon** - mocking/stubbing
- **Supertest** - HTTP assertions
- **Proxyquire** - module mocking

## Примеры запусков

```bash
# Все тесты
npm test

# Конкретный файл
npx mocha test/routes.test.js

# С verbose output
npx mocha --reporter spec

# С coverage
npx nyc npm test
```

## Рекомендации по улучшению

1. **SQL Injection** - рекомендуется использовать prepared statements вместо прямого внедрения переменных
2. **Error Handling** - добавить более детальную обработку ошибок
3. **File Validation** - проверять тип и размер загружаемых файлов
4. **Database Connection** - добавить пула соединений для production
5. **Test Coverage** - стремиться к 80%+ покрытию

## Структура теста (пример)

```javascript
describe('Component/Feature', () => {
  let mockDependency;

  beforeEach(() => {
    // Setup
    mockDependency = sinon.stub();
  });

  afterEach(() => {
    // Cleanup
    sinon.restore();
  });

  it('should do something specific', (done) => {
    // Arrange
    // Act
    // Assert
    expect(result).to.equal(expected);
    done();
  });
});
```
