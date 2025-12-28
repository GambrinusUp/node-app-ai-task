/**
 * Artillery Processor
 * Кастомная обработка данных и вывод метрик
 */

module.exports = {
  // Setup перед тестом
  setup: function(context, ee, next) {
    console.log('='.repeat(80));
    console.log('🔥 ARTILLERY LOAD TEST - PhotoGallery');
    console.log('='.repeat(80));
    console.log('Запуск нагрузочного теста...\n');
    next();
  },

  // Processing запроса
  beforeRequest: function(requestParams, context, ee, next) {
    // Можно добавить кастомные заголовки
    requestParams.headers['X-Test-Run'] = 'artillery-load-test';
    next();
  },

  // Processing ответа
  afterResponse: function(requestParams, responseParams, context, ee, next) {
    // Логирование медленных запросов
    if (responseParams.timings && responseParams.timings.total > 1000) {
      console.log(`⚠️  Slow response: ${requestParams.url} took ${responseParams.timings.total}ms`);
    }

    // Обработка ошибок
    if (responseParams.statusCode >= 400) {
      console.log(`❌ Error: ${requestParams.url} returned ${responseParams.statusCode}`);
    }

    next();
  },

  // Cleanup после теста
  teardown: function(context, ee, next) {
    console.log('\n✅ Тест завершен');
    next();
  }
};
