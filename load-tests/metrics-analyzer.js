/**
 * Metrics Analysis & Report Generator
 * 
 * Анализирует результаты нагрузочного тестирования
 * и генерирует HTML отчет
 */

const fs = require('fs');
const path = require('path');

class MetricsAnalyzer {
  constructor(resultsDir = './load-tests/results') {
    this.resultsDir = resultsDir;
    this.results = [];
  }

  /**
   * Загрузка всех результатов из директории
   */
  loadResults() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log('❌ Directory not found:', this.resultsDir);
      return [];
    }

    const files = fs.readdirSync(this.resultsDir)
      .filter(f => f.startsWith('load_test_') && f.endsWith('.json'))
      .sort()
      .reverse();

    return files.map(file => {
      const content = fs.readFileSync(path.join(this.resultsDir, file), 'utf8');
      return {
        filename: file,
        timestamp: new Date(parseInt(file.match(/\d+/)[0])),
        data: JSON.parse(content)
      };
    });
  }

  /**
   * Генерация HTML отчета
   */
  generateHtmlReport(results) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Report - PhotoGallery</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 30px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .metric-card h3 {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: bold;
        }
        
        .metric-unit {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-top: 8px;
        }
        
        .status.good {
            background: #4caf50;
        }
        
        .status.warning {
            background: #ff9800;
        }
        
        .status.bad {
            background: #f44336;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
            border-left: 4px solid #667eea;
            padding-left: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th {
            background: #f5f5f5;
            color: #333;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        tr:hover {
            background: #f9f9f9;
        }
        
        .chart {
            margin: 20px 0;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        
        .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #667eea;
            background: #f0f4ff;
            border-radius: 4px;
        }
        
        .recommendation.warning {
            border-left-color: #ff9800;
            background: #fff3e0;
        }
        
        .recommendation.error {
            border-left-color: #f44336;
            background: #ffebee;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 Load Test Report - PhotoGallery</h1>
        <p class="subtitle">Application Performance Under Load</p>
        
        ${this.generateMetricsCards(results[0].data.metrics)}
        
        <div class="section">
            <h2>📊 Detailed Metrics</h2>
            ${this.generateMetricsTable(results[0].data.metrics)}
        </div>
        
        <div class="section">
            <h2>⚠️ Analysis & Recommendations</h2>
            ${this.generateRecommendations(results[0].data.metrics)}
        </div>
        
        <div class="section">
            <h2>📈 Test Configuration</h2>
            ${this.generateConfigTable(results[0].data.config)}
        </div>
        
        <div class="footer">
            <p>Generated: ${new Date().toISOString()}</p>
            <p>Test Environment: ${results[0].data.config.url}</p>
        </div>
    </div>
</body>
</html>
    `;
    return html;
  }

  /**
   * Генерация карточек метрик
   */
  generateMetricsCards(metrics) {
    const errorRate = (metrics.errors / metrics.totalRequests) * 100;
    const status = (m) => {
      if (m < 0.1) return 'good';
      if (m < 1) return 'warning';
      return 'bad';
    };

    return `
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Requests</h3>
                <div class="metric-value">${metrics.totalRequests.toLocaleString()}</div>
                <div class="status good">Completed</div>
            </div>
            
            <div class="metric-card">
                <h3>Mean RPS</h3>
                <div class="metric-value">${metrics.rps.mean.toFixed(2)}</div>
                <div class="metric-unit">requests/second</div>
            </div>
            
            <div class="metric-card">
                <h3>Mean Latency</h3>
                <div class="metric-value">${metrics.latency.mean.toFixed(0)}</div>
                <div class="metric-unit">milliseconds</div>
            </div>
            
            <div class="metric-card">
                <h3>p99 Latency</h3>
                <div class="metric-value">${metrics.latency.p99}</div>
                <div class="metric-unit">milliseconds</div>
            </div>
            
            <div class="metric-card">
                <h3>Error Rate</h3>
                <div class="metric-value">${errorRate.toFixed(2)}</div>
                <div class="metric-unit">percent</div>
                <div class="status ${status(errorRate)}">
                    ${errorRate < 0.1 ? '✅ Good' : errorRate < 1 ? '⚠️ Warning' : '❌ High'}
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Throughput</h3>
                <div class="metric-value">${(metrics.throughput.mean / 1024).toFixed(2)}</div>
                <div class="metric-unit">KB/s</div>
            </div>
        </div>
    `;
  }

  /**
   * Генерация таблицы метрик
   */
  generateMetricsTable(metrics) {
    return `
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Requests</td>
                <td>${metrics.totalRequests.toLocaleString()}</td>
            </tr>
            <tr>
                <td>RPS Mean</td>
                <td>${metrics.rps.mean.toFixed(2)} req/s</td>
            </tr>
            <tr>
                <td>RPS p50</td>
                <td>${metrics.rps.p50.toFixed(2)} req/s</td>
            </tr>
            <tr>
                <td>RPS p90</td>
                <td>${metrics.rps.p90.toFixed(2)} req/s</td>
            </tr>
            <tr>
                <td>RPS p99</td>
                <td>${metrics.rps.p99.toFixed(2)} req/s</td>
            </tr>
            <tr>
                <td>Latency Mean</td>
                <td>${metrics.latency.mean.toFixed(2)} ms</td>
            </tr>
            <tr>
                <td>Latency p50</td>
                <td>${metrics.latency.p50} ms</td>
            </tr>
            <tr>
                <td>Latency p90</td>
                <td>${metrics.latency.p90} ms</td>
            </tr>
            <tr>
                <td>Latency p99</td>
                <td>${metrics.latency.p99} ms</td>
            </tr>
            <tr>
                <td>Latency Min</td>
                <td>${metrics.latency.min} ms</td>
            </tr>
            <tr>
                <td>Latency Max</td>
                <td>${metrics.latency.max} ms</td>
            </tr>
            <tr>
                <td>Errors</td>
                <td>${metrics.errors}</td>
            </tr>
            <tr>
                <td>Timeouts</td>
                <td>${metrics.timeouts}</td>
            </tr>
            <tr>
                <td>Throughput Mean</td>
                <td>${(metrics.throughput.mean / 1024).toFixed(2)} KB/s</td>
            </tr>
        </table>
    `;
  }

  /**
   * Генерация рекомендаций
   */
  generateRecommendations(metrics) {
    const errorRate = (metrics.errors / metrics.totalRequests) * 100;
    let recommendations = '';

    if (metrics.latency.p99 > 1000) {
      recommendations += `
        <div class="recommendation warning">
            <strong>⚠️ High p99 Latency</strong><br>
            p99 latency is ${metrics.latency.p99}ms, which exceeds the 1000ms threshold.
            Consider optimizing database queries, caching strategies, or upgrading resources.
        </div>
      `;
    }

    if (errorRate > 1) {
      recommendations += `
        <div class="recommendation error">
            <strong>❌ High Error Rate</strong><br>
            Error rate is ${errorRate.toFixed(2)}%, which exceeds the 1% threshold.
            Review application logs and error handling.
        </div>
      `;
    }

    if (metrics.rps.mean < 100) {
      recommendations += `
        <div class="recommendation warning">
            <strong>⚠️ Low Throughput</strong><br>
            Mean RPS is ${metrics.rps.mean.toFixed(2)}, which is below 100 req/s.
            Consider load balancing or optimizing request handling.
        </div>
      `;
    }

    if (metrics.latency.mean < 50 && errorRate < 0.1) {
      recommendations += `
        <div class="recommendation" style="border-left-color: #4caf50; background: #e8f5e9;">
            <strong>✅ Excellent Performance</strong><br>
            Low latency (${metrics.latency.mean.toFixed(2)}ms) and minimal errors.
            Application is performing well under load.
        </div>
      `;
    }

    if (!recommendations) {
      recommendations = `
        <div class="recommendation">
            <strong>✅ Performance Summary</strong><br>
            Application performance appears to be within acceptable ranges.
        </div>
      `;
    }

    return recommendations;
  }

  /**
   * Генерация таблицы конфигурации
   */
  generateConfigTable(config) {
    return `
        <table>
            <tr>
                <th>Parameter</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Target URL</td>
                <td>${config.url}</td>
            </tr>
            <tr>
                <td>Connections</td>
                <td>${config.connections}</td>
            </tr>
            <tr>
                <td>Duration</td>
                <td>${config.duration} seconds</td>
            </tr>
            <tr>
                <td>Pipelining</td>
                <td>${config.pipelining}</td>
            </tr>
        </table>
    `;
  }

  /**
   * Главный метод для генерации отчета
   */
  generateReport() {
    const results = this.loadResults();
    
    if (results.length === 0) {
      console.log('❌ No test results found');
      return;
    }

    console.log(`\n📊 Found ${results.length} test result(s)`);
    console.log(`Latest test: ${results[0].timestamp}`);

    const html = this.generateHtmlReport(results);
    const reportPath = path.join(this.resultsDir, 'report.html');
    
    fs.writeFileSync(reportPath, html);
    console.log(`\n✅ Report generated: ${reportPath}`);
    console.log(`📖 Open in browser: file://${path.resolve(reportPath)}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const analyzer = new MetricsAnalyzer();
  analyzer.generateReport();
}

module.exports = MetricsAnalyzer;
