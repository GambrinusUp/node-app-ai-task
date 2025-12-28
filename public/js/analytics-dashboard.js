/**
 * Analytics Dashboard Helper
 * Вспомогательные функции для интеграции аналитики в фронтенд
 */

class AnalyticsDashboard {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  /**
   * Получить полную сводку
   */
  async getSummary() {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * Получить статистику
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Получить статистику использования
   * @param {string} period - hourly, daily, weekly, monthly
   */
  async getUsage(period = 'daily') {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/usage?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch usage');
      return await response.json();
    } catch (error) {
      console.error('Error fetching usage:', error);
      throw error;
    }
  }

  /**
   * Получить статистику авторов
   */
  async getAuthors() {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/authors`);
      if (!response.ok) throw new Error('Failed to fetch authors');
      return await response.json();
    } catch (error) {
      console.error('Error fetching authors:', error);
      throw error;
    }
  }

  /**
   * Получить временную линию
   */
  async getTimeline() {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return await response.json();
    } catch (error) {
      console.error('Error fetching timeline:', error);
      throw error;
    }
  }

  /**
   * Обновить все данные аналитики
   */
  async refreshAll() {
    try {
      const [summary, stats, usage, authors, timeline] = await Promise.all([
        this.getSummary(),
        this.getStats(),
        this.getUsage(),
        this.getAuthors(),
        this.getTimeline()
      ]);

      return {
        summary,
        stats,
        usage,
        authors,
        timeline,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      throw error;
    }
  }

  /**
   * Форматировать размер файла в читаемый формат
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Отобразить сводку в консоли
   */
  async displaySummary() {
    try {
      const data = await this.getSummary();
      const s = data.data.summary;

      console.log('╔════════════════════════════════════╗');
      console.log('║     ANALYTICS SUMMARY              ║');
      console.log('╠════════════════════════════════════╣');
      console.log(`║ Total Images: ${String(s.total_images).padEnd(21)}║`);
      console.log(`║ Unique Authors: ${String(s.unique_authors).padEnd(18)}║`);
      console.log(`║ Storage: ${this.formatFileSize(parseFloat(s.total_storage_mb) * 1024 * 1024).padEnd(25)}║`);
      console.log(`║ Avg Daily Uploads: ${String(s.average_daily_uploads).padEnd(14)}║`);
      console.log('╚════════════════════════════════════╝');

      if (data.data.top_authors && data.data.top_authors.length > 0) {
        console.log('\nTop Authors:');
        data.data.top_authors.slice(0, 5).forEach((author, index) => {
          console.log(`  ${index + 1}. ${author.author} - ${author.images_count} images`);
        });
      }

      return data;
    } catch (error) {
      console.error('Error displaying summary:', error);
    }
  }
}

// Экспортировать для использования в браузере
if (typeof window !== 'undefined') {
  window.AnalyticsDashboard = AnalyticsDashboard;
}

// Экспортировать для Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsDashboard;
}
