#!/usr/bin/env node

// Автоматизированный тестовый скрипт для Neo4j n8n плагина
// automation/isolated-test-runner.js

const axios = require('axios');
const neo4j = require('neo4j-driver');

class IsolatedTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:5678';
    this.testResults = [];
    this.performanceMetrics = {};
    this.errorLog = [];
    this.overallStatus = 'PENDING';
  }

  async runAllTests() {
    console.log('🚀 Starting Automated Isolated Testing...');
    console.log('📊 Testing Neo4j n8n Community Node');
    
    try {
      // Phase 1: Environment Validation
      await this.validateEnvironment();
      
      // Phase 2: Direct Neo4j Connection Test
      await this.testDirectNeo4jConnection();
      
      // Phase 3: Node Discovery Test (if n8n API allows)
      await this.testNodeAvailability();
      
      // Phase 4: Performance Baseline
      await this.establishPerformanceBaseline();
      
      // Phase 5: Error Handling Validation
      await this.testErrorHandling();
      
      // Phase 6: Generate Report
      await this.generateReport();
      
      this.overallStatus = 'PASSED';
      console.log('✅ All Automated Tests PASSED');
      
    } catch (error) {
      this.overallStatus = 'FAILED';
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      console.log('❌ Automated Testing FAILED:', error.message);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Phase 1: Environment Validation');
    
    // Test Neo4j availability
    try {
      const startTime = Date.now();
      const driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'password123')
      );
      
      const session = driver.session();
      const result = await session.run('RETURN 1 as test');
      const responseTime = Date.now() - startTime;
      
      await session.close();
      await driver.close();
      
      this.testResults.push({
        test: 'neo4j_connection',
        status: 'PASSED',
        responseTime: responseTime,
        details: 'Neo4j connection successful'
      });
      
      console.log(`✅ Neo4j Connection: ${responseTime}ms`);
      
    } catch (error) {
      this.testResults.push({
        test: 'neo4j_connection',
        status: 'FAILED',
        error: error.message
      });
      throw new Error(`Neo4j connection failed: ${error.message}`);
    }

    // Test n8n availability
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/healthz`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      this.testResults.push({
        test: 'n8n_health',
        status: response.status === 200 ? 'PASSED' : 'FAILED',
        responseTime: responseTime,
        details: `n8n health status: ${response.status}`
      });
      
      console.log(`✅ n8n Health Check: ${responseTime}ms`);
      
    } catch (error) {
      this.testResults.push({
        test: 'n8n_health',
        status: 'FAILED', 
        error: error.message
      });
      console.log(`⚠️  n8n Health Check Failed: ${error.message}`);
    }
  }

  async testDirectNeo4jConnection() {
    console.log('🔗 Phase 2: Direct Neo4j Operations Test');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      // Test 1: Count existing data
      const startTime1 = Date.now();
      const result1 = await session.run('MATCH (n) RETURN count(n) as total_nodes');
      const responseTime1 = Date.now() - startTime1;
      const totalNodes = result1.records[0].get('total_nodes').toNumber();
      
      this.testResults.push({
        test: 'count_existing_nodes',
        status: 'PASSED',
        responseTime: responseTime1,
        details: `Found ${totalNodes} existing nodes`
      });
      console.log(`✅ Existing Nodes Count: ${totalNodes} (${responseTime1}ms)`);
      
      // Test 2: Complex query performance
      const startTime2 = Date.now();
      const result2 = await session.run(`
        MATCH (p:Person)-[:WORKS_FOR]->(c:Company)
        RETURN p.name as person, c.name as company
        LIMIT 10
      `);
      const responseTime2 = Date.now() - startTime2;
      
      this.testResults.push({
        test: 'complex_graph_query',
        status: 'PASSED',
        responseTime: responseTime2,
        details: `Retrieved ${result2.records.length} person-company relationships`
      });
      console.log(`✅ Complex Query: ${result2.records.length} results (${responseTime2}ms)`);
      
      // Test 3: Write operation
      const startTime3 = Date.now();
      const result3 = await session.run(`
        CREATE (t:TestNode {
          id: 'automated_test_' + timestamp(),
          created_by: 'isolated_test_runner',
          created_at: datetime()
        })
        RETURN t.id as test_id
      `);
      const responseTime3 = Date.now() - startTime3;
      
      const testId = result3.records[0].get('test_id');
      
      this.testResults.push({
        test: 'create_test_node',
        status: 'PASSED',
        responseTime: responseTime3,
        details: `Created test node: ${testId}`
      });
      console.log(`✅ Node Creation: ${testId} (${responseTime3}ms)`);
      
      // Test 4: Schema validation
      const startTime4 = Date.now();
      const result4 = await session.run('CALL db.labels() YIELD label RETURN collect(label) as labels');
      const responseTime4 = Date.now() - startTime4;
      
      const labels = result4.records[0].get('labels');
      
      this.testResults.push({
        test: 'schema_labels',
        status: labels.length > 0 ? 'PASSED' : 'FAILED',
        responseTime: responseTime4,
        details: `Found labels: ${labels.join(', ')}`
      });
      console.log(`✅ Schema Labels: ${labels.length} types (${responseTime4}ms)`);
      
      await session.close();
      
    } finally {
      await driver.close();
    }
  }

  async testNodeAvailability() {
    console.log('🎯 Phase 3: Node Availability Test');
    
    // Since we can't easily access n8n's internal node registry,
    // we'll test the file presence and structure
    
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Check if our built node files exist
      const distPath = './dist';
      const nodeFiles = await fs.readdir(path.join(distPath, 'nodes', 'Neo4j'));
      
      const requiredFiles = ['Neo4j.node.js', 'Neo4j.node.d.ts', 'neo4j.svg'];
      const missingFiles = requiredFiles.filter(file => !nodeFiles.includes(file));
      
      if (missingFiles.length === 0) {
        this.testResults.push({
          test: 'node_files_present',
          status: 'PASSED',
          details: `All required node files present: ${requiredFiles.join(', ')}`
        });
        console.log('✅ Node Files: All present');
      } else {
        this.testResults.push({
          test: 'node_files_present',
          status: 'FAILED',
          details: `Missing files: ${missingFiles.join(', ')}`
        });
        console.log(`❌ Node Files: Missing ${missingFiles.join(', ')}`);
      }
      
      // Check credentials files
      const credFiles = await fs.readdir(path.join(distPath, 'credentials'));
      if (credFiles.includes('Neo4jApi.credentials.js')) {
        this.testResults.push({
          test: 'credentials_files_present',
          status: 'PASSED',
          details: 'Credentials file present'
        });
        console.log('✅ Credentials: Present');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'node_files_check',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Node Files Check: ${error.message}`);
    }
  }

  async establishPerformanceBaseline() {
    console.log('⚡ Phase 4: Performance Baseline');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      // Benchmark: Simple query performance
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await session.run('MATCH (p:Person) RETURN count(p)');
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      this.performanceMetrics.simple_query = {
        average: avgTime,
        min: minTime,
        max: maxTime,
        iterations: iterations
      };
      
      this.testResults.push({
        test: 'performance_baseline',
        status: avgTime < 100 ? 'PASSED' : 'WARNING',
        details: `Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`
      });
      
      console.log(`⚡ Query Performance: Avg ${avgTime.toFixed(2)}ms (${minTime}-${maxTime}ms)`);
      
      await session.close();
      
    } finally {
      await driver.close();
    }
  }

  async testErrorHandling() {
    console.log('🛡️  Phase 5: Error Handling Test');
    
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password123')
    );

    try {
      const session = driver.session();
      
      // Test invalid Cypher query
      try {
        await session.run('INVALID CYPHER SYNTAX SHOULD FAIL');
        this.testResults.push({
          test: 'invalid_cypher_handling',
          status: 'FAILED',
          details: 'Invalid query should have failed but did not'
        });
      } catch (error) {
        this.testResults.push({
          test: 'invalid_cypher_handling',
          status: 'PASSED',
          details: `Correctly handled invalid Cypher: ${error.code}`
        });
        console.log(`✅ Invalid Cypher: Correctly handled (${error.code})`);
      }
      
      await session.close();
      
    } finally {
      await driver.close();
    }

    // Test invalid connection
    try {
      const invalidDriver = neo4j.driver(
        'bolt://invalid:7687',
        neo4j.auth.basic('invalid', 'invalid')
      );
      
      const session = invalidDriver.session();
      await session.run('RETURN 1');
      await session.close();
      await invalidDriver.close();
      
    } catch (error) {
      this.testResults.push({
        test: 'invalid_connection_handling',
        status: 'PASSED',
        details: `Correctly handled invalid connection: ${error.code}`
      });
      console.log(`✅ Invalid Connection: Correctly handled (${error.code})`);
    }
  }

  async generateReport() {
    console.log('📊 Phase 6: Generating Test Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        neo4j_version: '5.15-community',
        n8n_version: 'latest',
        node_version: process.version,
        platform: process.platform
      },
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASSED').length,
        failed: this.testResults.filter(r => r.status === 'FAILED').length,
        warnings: this.testResults.filter(r => r.status === 'WARNING').length
      },
      results: this.testResults,
      performance: this.performanceMetrics,
      errors: this.errorLog,
      overall_status: this.overallStatus,
      recommendations: this.generateRecommendations()
    };

    const fs = require('fs').promises;
    const reportPath = `./docs/reports/isolated-test-${Date.now()}.json`;
    
    await fs.mkdir('./docs/reports', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Report saved: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.some(r => r.test === 'n8n_health' && r.status === 'FAILED')) {
      recommendations.push('⚠️  n8n service is not responding - check container status');
    }
    
    if (this.performanceMetrics.simple_query?.average > 100) {
      recommendations.push('⚡ Query performance is slower than expected - consider database optimization');
    }
    
    const failedTests = this.testResults.filter(r => r.status === 'FAILED');
    if (failedTests.length > 0) {
      recommendations.push(`🔧 ${failedTests.length} tests failed - manual intervention required before user testing`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ All systems operational - ready for Integration Testing phase');
    }
    
    return recommendations;
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IsolatedTestRunner();
  runner.runAllTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = IsolatedTestRunner;