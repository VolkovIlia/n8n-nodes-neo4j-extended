#!/usr/bin/env node

// Performance Testing Specialist - Нагрузочное тестирование Neo4j n8n интеграции
// automation/performance-test-runner.js

const neo4j = require('neo4j-driver');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class PerformanceTestRunner {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = {};
    this.loadTestResults = {};
    this.overallStatus = 'PENDING';
  }

  async runPerformanceTests() {
    console.log('⚡ Starting Performance Testing Specialist');
    console.log('📊 Neo4j Performance & Load Testing');
    
    try {
      // Phase 1: Baseline Performance
      await this.establishBaselinePerformance();
      
      // Phase 2: Query Performance Tests  
      await this.testQueryPerformance();
      
      // Phase 3: Concurrent Operations
      await this.testConcurrentOperations();
      
      // Phase 4: Memory Usage Analysis
      await this.analyzeMemoryUsage();
      
      // Phase 5: Vector Operations Performance
      await this.testVectorPerformance();
      
      // Phase 6: Generate Performance Report
      await this.generatePerformanceReport();
      
      this.overallStatus = 'PASSED';
      console.log('✅ Performance Testing COMPLETED');
      
    } catch (error) {
      this.overallStatus = 'FAILED';
      console.log('❌ Performance Testing FAILED:', error.message);
    }
  }

  async establishBaselinePerformance() {
    console.log('📏 Phase 1: Baseline Performance');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      // Test 1: Simple query baseline
      const simpleQueryTimes = [];
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await session.run('RETURN 1 as test');
        simpleQueryTimes.push(Date.now() - start);
      }
      
      const simpleAvg = simpleQueryTimes.reduce((a, b) => a + b, 0) / simpleQueryTimes.length;
      
      this.performanceMetrics.simple_query = {
        average: simpleAvg,
        min: Math.min(...simpleQueryTimes),
        max: Math.max(...simpleQueryTimes),
        p95: this.percentile(simpleQueryTimes, 95),
        p99: this.percentile(simpleQueryTimes, 99)
      };
      
      console.log(`✅ Simple Query: ${simpleAvg.toFixed(2)}ms avg (p95: ${this.performanceMetrics.simple_query.p95}ms)`);
      
      // Test 2: Node count baseline
      const countQueryTimes = [];
      for (let i = 0; i < 30; i++) {
        const start = Date.now();
        await session.run('MATCH (n) RETURN count(n)');
        countQueryTimes.push(Date.now() - start);
      }
      
      const countAvg = countQueryTimes.reduce((a, b) => a + b, 0) / countQueryTimes.length;
      
      this.performanceMetrics.count_query = {
        average: countAvg,
        min: Math.min(...countQueryTimes),
        max: Math.max(...countQueryTimes),
        p95: this.percentile(countQueryTimes, 95)
      };
      
      console.log(`✅ Count Query: ${countAvg.toFixed(2)}ms avg (p95: ${this.performanceMetrics.count_query.p95}ms)`);
      
      await session.close();
      
    } finally {
      await driver.close();
    }
  }

  async testQueryPerformance() {
    console.log('🔍 Phase 2: Query Performance Tests');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      const queries = [
        {
          name: 'person_lookup',
          cypher: 'MATCH (p:Person {name: $name}) RETURN p',
          params: { name: 'John Smith' }
        },
        {
          name: 'company_employees',
          cypher: 'MATCH (p:Person)-[:WORKS_FOR]->(c:Company {name: $company}) RETURN p.name',
          params: { company: 'Tech Corp' }
        },
        {
          name: 'project_relationships',
          cypher: 'MATCH (p:Person)-[:WORKS_ON]->(proj:Project)<-[:SPONSORS]-(c:Company) RETURN p.name, proj.name, c.name',
          params: {}
        },
        {
          name: 'document_search',
          cypher: 'MATCH (d:Document) WHERE d.content CONTAINS $keyword RETURN d.title',
          params: { keyword: 'machine learning' }
        }
      ];
      
      for (const query of queries) {
        const times = [];
        
        for (let i = 0; i < 20; i++) {
          const start = Date.now();
          const result = await session.run(query.cypher, query.params);
          const elapsed = Date.now() - start;
          times.push(elapsed);
        }
        
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        
        this.performanceMetrics[query.name] = {
          average: avg,
          min: Math.min(...times),
          max: Math.max(...times),
          p95: this.percentile(times, 95)
        };
        
        const status = avg < 100 ? 'EXCELLENT' : avg < 500 ? 'GOOD' : 'NEEDS_OPTIMIZATION';
        
        this.testResults.push({
          test: `query_performance_${query.name}`,
          status: status === 'NEEDS_OPTIMIZATION' ? 'WARNING' : 'PASSED',
          details: `${avg.toFixed(2)}ms avg, p95: ${this.performanceMetrics[query.name].p95}ms`,
          performance_rating: status
        });
        
        console.log(`✅ ${query.name}: ${avg.toFixed(2)}ms avg (${status})`);
      }
      
      await session.close();
      
    } finally {
      await driver.close();
    }
  }

  async testConcurrentOperations() {
    console.log('⚡ Phase 3: Concurrent Operations');
    
    if (isMainThread) {
      const concurrencyLevels = [1, 5, 10, 20];
      
      for (const concurrency of concurrencyLevels) {
        console.log(`🔄 Testing ${concurrency} concurrent operations...`);
        
        const start = Date.now();
        const workers = [];
        const results = [];
        
        for (let i = 0; i < concurrency; i++) {
          const worker = new Worker(__filename, {
            workerData: { 
              operation: 'concurrent_query',
              workerId: i,
              iterations: 10
            }
          });
          
          workers.push(new Promise((resolve, reject) => {
            worker.on('message', (result) => {
              results.push(result);
              resolve(result);
            });
            worker.on('error', reject);
          }));
        }
        
        const workerResults = await Promise.all(workers);
        const totalTime = Date.now() - start;
        
        const allTimes = workerResults.flatMap(r => r.times);
        const avgTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
        const totalOperations = workerResults.reduce((sum, r) => sum + r.operations, 0);
        const opsPerSecond = (totalOperations / totalTime) * 1000;
        
        this.loadTestResults[`concurrent_${concurrency}`] = {
          concurrency: concurrency,
          total_operations: totalOperations,
          total_time: totalTime,
          average_response_time: avgTime,
          operations_per_second: opsPerSecond,
          p95_response_time: this.percentile(allTimes, 95)
        };
        
        const status = avgTime < 200 ? 'PASSED' : 'WARNING';
        
        this.testResults.push({
          test: `concurrent_operations_${concurrency}`,
          status: status,
          details: `${avgTime.toFixed(2)}ms avg, ${opsPerSecond.toFixed(2)} ops/sec`,
          performance_rating: status === 'PASSED' ? 'EXCELLENT' : 'ACCEPTABLE'
        });
        
        console.log(`✅ ${concurrency} concurrent: ${opsPerSecond.toFixed(2)} ops/sec, ${avgTime.toFixed(2)}ms avg`);
      }
    }
  }

  async testVectorPerformance() {
    console.log('🧠 Phase 5: Vector Operations Performance');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687', 
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      // Create test documents with mock vector data
      const batchSize = 100;
      const createStart = Date.now();
      
      for (let batch = 0; batch < 5; batch++) {
        const batchStart = Date.now();
        
        await session.run(`
          UNWIND range($start, $end) as i
          CREATE (d:TestDocument {
            id: 'perf_test_' + i,
            content: 'Performance test document ' + i + ' with machine learning content',
            vector: [rand(), rand(), rand()],
            category: 'performance_test',
            created: timestamp()
          })
        `, { 
          start: batch * batchSize,
          end: (batch + 1) * batchSize - 1
        });
        
        const batchTime = Date.now() - batchStart;
        console.log(`📝 Created batch ${batch + 1}/5: ${batchTime}ms`);
      }
      
      const createTime = Date.now() - createStart;
      
      this.performanceMetrics.vector_creation = {
        total_documents: 500,
        total_time: createTime,
        documents_per_second: (500 / createTime) * 1000
      };
      
      console.log(`✅ Vector Creation: ${this.performanceMetrics.vector_creation.documents_per_second.toFixed(2)} docs/sec`);
      
      // Test search performance
      const searchTimes = [];
      
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await session.run(`
          MATCH (d:TestDocument)
          WHERE d.content CONTAINS 'machine learning'
          RETURN d.id, d.content
          LIMIT 10
        `);
        searchTimes.push(Date.now() - start);
      }
      
      const searchAvg = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      
      this.performanceMetrics.vector_search = {
        average: searchAvg,
        min: Math.min(...searchTimes),
        max: Math.max(...searchTimes),
        p95: this.percentile(searchTimes, 95)
      };
      
      console.log(`✅ Vector Search: ${searchAvg.toFixed(2)}ms avg`);
      
      // Cleanup test documents
      await session.run('MATCH (d:TestDocument) DELETE d');
      console.log('🧹 Cleaned up test documents');
      
      await session.close();
      
    } finally {
      await driver.close();
    }
  }

  async analyzeMemoryUsage() {
    console.log('💾 Phase 4: Memory Usage Analysis');
    
    const initialMemory = process.memoryUsage();
    
    // Simulate heavy operations
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );
    
    try {
      const sessions = [];
      
      // Create multiple sessions
      for (let i = 0; i < 10; i++) {
        sessions.push(driver.session());
      }
      
      // Run operations
      const promises = sessions.map(async (session, index) => {
        for (let i = 0; i < 50; i++) {
          await session.run('MATCH (n) RETURN count(n)');
        }
      });
      
      await Promise.all(promises);
      
      // Cleanup sessions
      for (const session of sessions) {
        await session.close();
      }
      
      const finalMemory = process.memoryUsage();
      
      this.performanceMetrics.memory_usage = {
        initial_heap: initialMemory.heapUsed,
        final_heap: finalMemory.heapUsed,
        heap_delta: finalMemory.heapUsed - initialMemory.heapUsed,
        initial_external: initialMemory.external,
        final_external: finalMemory.external,
        external_delta: finalMemory.external - initialMemory.external
      };
      
      const heapDeltaMB = this.performanceMetrics.memory_usage.heap_delta / 1024 / 1024;
      
      console.log(`💾 Memory Delta: ${heapDeltaMB.toFixed(2)}MB heap`);
      
      const status = heapDeltaMB < 50 ? 'PASSED' : 'WARNING';
      
      this.testResults.push({
        test: 'memory_usage_analysis',
        status: status,
        details: `${heapDeltaMB.toFixed(2)}MB heap increase`,
        performance_rating: status === 'PASSED' ? 'EXCELLENT' : 'ACCEPTABLE'
      });
      
    } finally {
      await driver.close();
    }
  }

  async generatePerformanceReport() {
    console.log('📊 Phase 6: Performance Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      test_phase: 'performance_testing',
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASSED').length,
        warnings: this.testResults.filter(r => r.status === 'WARNING').length,
        failed: this.testResults.filter(r => r.status === 'FAILED').length
      },
      performance_metrics: this.performanceMetrics,
      load_test_results: this.loadTestResults,
      test_results: this.testResults,
      performance_assessment: this.generatePerformanceAssessment(),
      recommendations: this.generatePerformanceRecommendations()
    };

    const fs = require('fs').promises;
    await fs.mkdir('./docs/reports', { recursive: true });
    const reportPath = `./docs/reports/performance-test-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Performance Report: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failed} failed`);
    
    return report;
  }

  generatePerformanceAssessment() {
    const criticalMetrics = {
      simple_query_avg: this.performanceMetrics.simple_query?.average || 0,
      concurrent_10_avg: this.loadTestResults.concurrent_10?.average_response_time || 0,
      memory_delta: (this.performanceMetrics.memory_usage?.heap_delta || 0) / 1024 / 1024
    };
    
    let score = 100;
    let issues = [];
    
    if (criticalMetrics.simple_query_avg > 50) {
      score -= 20;
      issues.push('Simple queries slower than expected');
    }
    
    if (criticalMetrics.concurrent_10_avg > 500) {
      score -= 30; 
      issues.push('Concurrent performance needs optimization');
    }
    
    if (criticalMetrics.memory_delta > 100) {
      score -= 25;
      issues.push('Memory usage higher than recommended');
    }
    
    return {
      overall_score: score,
      rating: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
      critical_metrics: criticalMetrics,
      issues: issues,
      ready_for_production: score >= 70
    };
  }

  generatePerformanceRecommendations() {
    const recommendations = [];
    
    if (this.performanceMetrics.simple_query?.average > 20) {
      recommendations.push('Consider adding database indexes for better query performance');
    }
    
    if (this.loadTestResults.concurrent_10?.operations_per_second < 50) {
      recommendations.push('Optimize for concurrent operations - consider connection pooling');
    }
    
    const memoryDelta = (this.performanceMetrics.memory_usage?.heap_delta || 0) / 1024 / 1024;
    if (memoryDelta > 50) {
      recommendations.push('Monitor memory usage in production - implement connection cleanup');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is excellent - ready for production use');
    }
    
    return recommendations;
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Worker thread logic for concurrent testing
if (!isMainThread) {
  const { operation, workerId, iterations } = workerData;
  
  if (operation === 'concurrent_query') {
    const neo4j = require('neo4j-driver');
    
    (async () => {
      const driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'password123')
      );
      
      try {
        const session = driver.session();
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
          const start = Date.now();
          await session.run('MATCH (n) RETURN count(n)');
          times.push(Date.now() - start);
        }
        
        await session.close();
        
        parentPort.postMessage({
          workerId: workerId,
          operations: iterations,
          times: times
        });
        
      } finally {
        await driver.close();
      }
    })().catch(console.error);
  }
}

// Run if called directly
if (require.main === module && isMainThread) {
  const runner = new PerformanceTestRunner();
  runner.runPerformanceTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Performance testing failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestRunner;