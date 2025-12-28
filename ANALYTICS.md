# Аналитические эндпоинты

Приложение предоставляет несколько эндпоинтов для получения аналитики и статистики по проекту.

## Доступные эндпоинты

### 1. `/analytics/summary` (GET)

Получить полную сводку по аналитике проекта.

**Пример запроса:**
```bash
curl http://localhost:3000/analytics/summary
```

**Пример ответа:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_images": 150,
      "unique_authors": 25,
      "total_storage_mb": "542.30",
      "average_daily_uploads": "3.50",
      "date_range": {
        "oldest": "2024-01-15T10:30:00.000Z",
        "newest": "2024-12-29T14:45:00.000Z"
      }
    },
    "storage": {
      "total_files": 150,
      "total_size_bytes": 568623104,
      "total_size_mb": "542.30",
      "average_file_size_bytes": 3790821
    },
    "top_authors": [
      {
        "author": "John Doe",
        "images_count": 32,
        "avg_description_length": 125.5,
        "first_upload": "2024-01-15T10:30:00.000Z",
        "last_upload": "2024-12-28T15:20:00.000Z"
      },
      ...
    ],
    "database_info": {
      "avg_name_length": "28.50",
      "avg_description_length": "156.75"
    }
  },
  "timestamp": "2024-12-29T14:50:00.000Z"
}
```

---

### 2. `/analytics/stats` (GET)

Получить детальную статистику по базе данных и хранилищу.

**Пример запроса:**
```bash
curl http://localhost:3000/analytics/stats
```

**Пример ответа:**
```json
{
  "success": true,
  "data": {
    "database": {
      "total_images": 150,
      "avg_name_length": 28.5,
      "avg_description_length": 156.75,
      "unique_authors": 25,
      "oldest_image": "2024-01-15T10:30:00.000Z",
      "newest_image": "2024-12-29T14:45:00.000Z"
    },
    "storage": {
      "total_files": 150,
      "total_size_bytes": 568623104,
      "total_size_mb": "542.30",
      "average_file_size_bytes": 3790821
    }
  },
  "timestamp": "2024-12-29T14:50:00.000Z"
}
```

---

### 3. `/analytics/usage` (GET)

Получить статистику использования сервиса по времени.

**Параметры запроса:**
- `period` (опционально): Период группировки данных
  - `hourly` - по часам
  - `daily` - по дням (по умолчанию)
  - `weekly` - по неделям
  - `monthly` - по месяцам

**Примеры запроса:**
```bash
# По дням (по умолчанию)
curl http://localhost:3000/analytics/usage

# По часам
curl http://localhost:3000/analytics/usage?period=hourly

# По месяцам
curl http://localhost:3000/analytics/usage?period=monthly
```

**Пример ответа:**
```json
{
  "success": true,
  "period": "daily",
  "count": 42,
  "data": [
    {
      "time_period": "2024-12-01",
      "uploads_count": 5,
      "unique_authors": 3
    },
    {
      "time_period": "2024-12-02",
      "uploads_count": 8,
      "unique_authors": 4
    },
    ...
  ],
  "timestamp": "2024-12-29T14:50:00.000Z"
}
```

---

### 4. `/analytics/authors` (GET)

Получить статистику по авторам.

**Пример запроса:**
```bash
curl http://localhost:3000/analytics/authors
```

**Пример ответа:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "author": "John Doe",
      "images_count": 32,
      "avg_description_length": 125.5,
      "first_upload": "2024-01-15T10:30:00.000Z",
      "last_upload": "2024-12-28T15:20:00.000Z"
    },
    {
      "author": "Jane Smith",
      "images_count": 28,
      "avg_description_length": 148.3,
      "first_upload": "2024-02-10T08:00:00.000Z",
      "last_upload": "2024-12-27T10:15:00.000Z"
    },
    ...
  ],
  "timestamp": "2024-12-29T14:50:00.000Z"
}
```

---

### 5. `/analytics/timeline` (GET)

Получить временную линию загрузок (последние 30 дней).

**Пример запроса:**
```bash
curl http://localhost:3000/analytics/timeline
```

**Пример ответа:**
```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "date": "2024-12-29",
      "uploads": 3,
      "authors": "John Doe, Jane Smith",
      "image_names": "sunset.jpg, beach.png, mountain.jpg"
    },
    {
      "date": "2024-12-28",
      "uploads": 5,
      "authors": "John Doe, Bob Johnson, Alice Wilson",
      "image_names": "park.jpg, forest.png, lake.jpg, river.jpg, city.jpg"
    },
    ...
  ],
  "timestamp": "2024-12-29T14:50:00.000Z"
}
```

---

## Использование в приложении

### Через JavaScript

```javascript
// Получить полную сводку
fetch('/analytics/summary')
  .then(res => res.json())
  .then(data => console.log(data));

// Получить статистику использования по месяцам
fetch('/analytics/usage?period=monthly')
  .then(res => res.json())
  .then(data => console.log(data));

// Получить информацию об авторах
fetch('/analytics/authors')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Использование с curl

```bash
# Все статистики в одном запросе
curl http://localhost:3000/analytics/summary | jq '.data.summary'

# Топ авторов
curl http://localhost:3000/analytics/authors | jq '.data[0:5]'

# Статистика по неделям
curl http://localhost:3000/analytics/usage?period=weekly | jq '.data'
```

---

## Структура файлов

- `utils/analytics.js` - модуль с функциями аналитики
- `routes/index.js` - определение аналитических эндпоинтов

---

## Оптимизация запросов

Для лучшей производительности рекомендуется:

1. **Кэширование результатов**: результаты аналитики можно кэшировать на клиенте или сервере
2. **Индексирование БД**: убедитесь, что на столбцах `date` и `author` есть индексы
3. **Ограничение периода**: для больших объемов данных ограничивайте период запроса

---

## Обработка ошибок

Все эндпоинты возвращают стандартные коды ошибок HTTP:

- `200` - успешный запрос
- `400` - некорректные параметры запроса
- `500` - ошибка сервера

Пример ошибки:
```json
{
  "error": "invalid_period",
  "message": "Period must be one of: hourly, daily, weekly, monthly"
}
```
