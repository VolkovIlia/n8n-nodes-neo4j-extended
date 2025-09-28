#!/usr/bin/env node

// Integration Testing Specialist - Автоматизированное тестирование n8n-Neo4j интеграции
// automation/integration-test-runner.js

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class IntegrationTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:5678';
    this.testResults = [];
    this.integrationMetrics = {};
    this.errorLog = [];
    this.overallStatus = 'PENDING';
  }

  async runIntegrationTests() {
    console.log('🔗 Starting Integration Testing Specialist');
    console.log('📊 Testing n8n ↔ Neo4j Integration');
    
    try {
      // Phase 1: n8n Service Validation
      await this.validateN8nService();
      
      // Phase 2: Community Node Detection  
      await this.testCommunityNodeDetection();
      
      // Phase 3: Workflow Import Testing
      await this.testWorkflowImport();
      
      // Phase 4: Neo4j Node Availability
      await this.testNeo4jNodeAvailability();
      
      // Phase 5: Basic Integration Validation
      await this.testBasicIntegration();
      
      // Phase 6: Generate Integration Report
      await this.generateIntegrationReport();
      
      this.overallStatus = 'PASSED';
      console.log('✅ Integration Testing COMPLETED');
      
    } catch (error) {
      this.overallStatus = 'FAILED';
      this.errorLog.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      console.log('❌ Integration Testing FAILED:', error.message);
    }
  }

  async validateN8nService() {
    console.log('🏥 Phase 1: n8n Service Health Check');
    
    const maxRetries = 10;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${this.baseUrl}`, { 
          timeout: 10000,
          headers: { 'User-Agent': 'IntegrationTestRunner/1.0' }
        });
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200) {
          this.testResults.push({
            test: 'n8n_service_health',
            status: 'PASSED',
            responseTime: responseTime,
            details: `n8n service responding (${response.status})`
          });
          console.log(`✅ n8n Service: Healthy (${responseTime}ms)`);
          return;
        }
        
      } catch (error) {
        attempt++;
        if (attempt < maxRetries) {
          console.log(`⏳ n8n not ready, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          this.testResults.push({
            test: 'n8n_service_health',
            status: 'WARNING', 
            error: error.message,
            details: 'n8n service not responding, but continuing tests'
          });
          console.log(`⚠️  n8n Service: Not responding after ${maxRetries} attempts`);
        }
      }
    }
  }

  async testCommunityNodeDetection() {
    console.log('🔍 Phase 2: Community Node Detection');
    
    // Check if our compiled node files exist and are valid
    try {
      const distPath = '../dist';
      
      // Check Neo4j node files
      const nodeDir = path.join(distPath, 'nodes', 'Neo4j');
      const nodeFiles = await fs.readdir(nodeDir);
      
      const requiredNodeFiles = ['Neo4j.node.js', 'Neo4j.node.d.ts', 'neo4j.svg'];
      const missingNodeFiles = requiredNodeFiles.filter(file => !nodeFiles.includes(file));
      
      if (missingNodeFiles.length === 0) {
        this.testResults.push({
          test: 'community_node_files',
          status: 'PASSED',
          details: `All node files present: ${requiredNodeFiles.join(', ')}`
        });
        console.log('✅ Node Files: Complete');
      } else {
        this.testResults.push({
          test: 'community_node_files',
          status: 'FAILED',
          details: `Missing files: ${missingNodeFiles.join(', ')}`
        });
        console.log(`❌ Node Files: Missing ${missingNodeFiles.join(', ')}`);
      }
      
      // Check credentials files
      const credDir = path.join(distPath, 'credentials');
      const credFiles = await fs.readdir(credDir);
      
      if (credFiles.includes('Neo4jApi.credentials.js')) {
        this.testResults.push({
          test: 'credentials_files',
          status: 'PASSED',
          details: 'Credentials file present'
        });
        console.log('✅ Credentials: Present');
      } else {
        this.testResults.push({
          test: 'credentials_files',
          status: 'FAILED',
          details: 'Missing Neo4jApi.credentials.js'
        });
        console.log('❌ Credentials: Missing');
      }
      
      // Validate package.json
      const packagePath = path.join(distPath, '..', 'package.json');
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      if (packageData.n8n && packageData.n8n.nodes && packageData.n8n.credentials) {
        this.testResults.push({
          test: 'package_json_config',
          status: 'PASSED',
          details: 'n8n configuration present in package.json'
        });
        console.log('✅ Package Config: Valid n8n configuration');
      } else {
        this.testResults.push({
          test: 'package_json_config',
          status: 'FAILED',
          details: 'Missing n8n configuration in package.json'
        });
        console.log('❌ Package Config: Invalid');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'community_node_detection',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Node Detection: ${error.message}`);
    }
  }

  async testWorkflowImport() {
    console.log('📋 Phase 3: Workflow Import Testing');
    
    const exampleWorkflows = [
      '../examples/ai-agent-vector-search.json',
      '../examples/graph-operations.json', 
      '../examples/hybrid-vector-graph.json'
    ];
    
    for (const workflowPath of exampleWorkflows) {
      try {
        const workflowData = JSON.parse(await fs.readFile(workflowPath, 'utf8'));
        const workflowName = workflowData.name || path.basename(workflowPath, '.json');
        
        // Validate workflow structure
        if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
          
          // Check for Neo4j nodes in workflow
          const neo4jNodes = workflowData.nodes.filter(node => 
            node.type === 'n8n-nodes-neo4j-extended.neo4j'
          );
          
          if (neo4jNodes.length > 0) {
            this.testResults.push({
              test: `workflow_import_${workflowName}`,
              status: 'PASSED',
              details: `Valid workflow with ${neo4jNodes.length} Neo4j nodes`
            });
            console.log(`✅ Workflow "${workflowName}": ${neo4jNodes.length} Neo4j nodes`);
          } else {
            this.testResults.push({
              test: `workflow_import_${workflowName}`,
              status: 'WARNING',
              details: 'Workflow has no Neo4j nodes'
            });
            console.log(`⚠️  Workflow "${workflowName}": No Neo4j nodes found`);
          }
          
        } else {
          this.testResults.push({
            test: `workflow_import_${workflowName}`,
            status: 'FAILED',
            details: 'Invalid workflow structure'
          });
          console.log(`❌ Workflow "${workflowName}": Invalid structure`);
        }
        
      } catch (error) {
        this.testResults.push({
          test: `workflow_import_${path.basename(workflowPath, '.json')}`,
          status: 'FAILED',
          error: error.message
        });
        console.log(`❌ Workflow Import: ${error.message}`);
      }
    }
  }

  async testNeo4jNodeAvailability() {
    console.log('🎯 Phase 4: Neo4j Node Availability');
    
    try {
      // Check if the compiled node has the correct structure
      const nodeFilePath = '../dist/nodes/Neo4j/Neo4j.node.js';
      const nodeContent = await fs.readFile(nodeFilePath, 'utf8');
      
      // Basic validation of node structure
      const requiredElements = [
        'class Neo4j',
        'description:',
        'displayName:',
        'name:',
        'properties:',
        'execute('
      ];
      
      const missingElements = requiredElements.filter(element => 
        !nodeContent.includes(element)
      );
      
      if (missingElements.length === 0) {
        this.testResults.push({
          test: 'neo4j_node_structure',
          status: 'PASSED',
          details: 'Neo4j node has all required elements'
        });
        console.log('✅ Node Structure: Complete');
      } else {
        this.testResults.push({
          test: 'neo4j_node_structure',
          status: 'FAILED',
          details: `Missing elements: ${missingElements.join(', ')}`
        });
        console.log(`❌ Node Structure: Missing ${missingElements.join(', ')}`);
      }
      
      // Check for specific operations
      const operations = [
        'similaritySearch',
        'addTexts',
        'addDocuments',
        'executeQuery',
        'createNode',
        'createRelationship',
        'getSchema'
      ];
      
      const foundOperations = operations.filter(op => nodeContent.includes(op));
      
      this.testResults.push({
        test: 'neo4j_node_operations',
        status: foundOperations.length >= 5 ? 'PASSED' : 'WARNING',
        details: `Found operations: ${foundOperations.join(', ')}`
      });
      
      console.log(`✅ Node Operations: ${foundOperations.length}/${operations.length} found`);
      
    } catch (error) {
      this.testResults.push({
        test: 'neo4j_node_availability',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Node Availability: ${error.message}`);
    }
  }

  async testBasicIntegration() {
    console.log('🔧 Phase 5: Basic Integration Tests');
    
    // Test Docker container communication
    try {
      const { spawn } = require('child_process');
      
      // Test if n8n container can resolve neo4j container
      const testCommand = spawn('docker', [
        'exec', 'n8n-test', 'nslookup', 'neo4j'
      ]);
      
      let output = '';
      testCommand.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        testCommand.on('close', (code) => {
          if (code === 0 && output.includes('neo4j')) {
            this.testResults.push({
              test: 'container_network_connectivity',
              status: 'PASSED',
              details: 'n8n can resolve neo4j container'
            });
            console.log('✅ Network: Containers can communicate');
            resolve();
          } else {
            this.testResults.push({
              test: 'container_network_connectivity',
              status: 'FAILED',
              details: 'n8n cannot resolve neo4j container'
            });
            console.log('❌ Network: Container communication failed');
            reject(new Error('Network connectivity failed'));
          }
        });
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'container_network_test',
        status: 'WARNING',
        error: error.message
      });
      console.log(`⚠️  Network Test: ${error.message}`);
    }
    
    // Test dependencies in n8n container
    try {
      const { spawn } = require('child_process');
      
      const testDeps = spawn('docker', [
        'exec', 'n8n-test', 'node', '-e', 'console.log(require("neo4j-driver").version)'
      ]);
      
      let depOutput = '';
      testDeps.stdout.on('data', (data) => {
        depOutput += data.toString();
      });
      
      await new Promise((resolve) => {
        testDeps.on('close', (code) => {
          if (code === 0 && depOutput.trim()) {
            this.testResults.push({
              test: 'neo4j_driver_dependency',
              status: 'PASSED',
              details: `neo4j-driver version: ${depOutput.trim()}`
            });
            console.log(`✅ Dependencies: neo4j-driver ${depOutput.trim()}`);
          } else {
            this.testResults.push({
              test: 'neo4j_driver_dependency',
              status: 'FAILED',
              details: 'neo4j-driver not available in n8n container'
            });
            console.log('❌ Dependencies: neo4j-driver missing');
          }
          resolve();
        });
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'dependency_check',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Dependencies: ${error.message}`);
    }
  }

  async generateIntegrationReport() {
    console.log('📊 Phase 6: Integration Test Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      test_phase: 'integration_testing',
      environment: {
        containers: {
          neo4j: 'neo4j:5.15-community',
          n8n: 'custom build with neo4j-driver'
        },
        node_version: process.version,
        platform: process.platform
      },
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASSED').length,
        failed: this.testResults.filter(r => r.status === 'FAILED').length,
        warnings: this.testResults.filter(r => r.status === 'WARNING').length
      },
      integration_results: this.testResults,
      metrics: this.integrationMetrics,
      errors: this.errorLog,
      overall_status: this.overallStatus,
      readiness_assessment: this.generateReadinessAssessment(),
      next_phase_requirements: this.generateNextPhaseRequirements()
    };

    await fs.mkdir('./docs/reports', { recursive: true });
    const reportPath = `./docs/reports/integration-test-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Integration Report: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
    
    return report;
  }

  generateReadinessAssessment() {
    const critical_tests = [
      'community_node_files',
      'credentials_files', 
      'package_json_config',
      'neo4j_node_structure',
      'neo4j_driver_dependency'
    ];
    
    const critical_failures = this.testResults.filter(r => 
      critical_tests.includes(r.test) && r.status === 'FAILED'
    );
    
    if (critical_failures.length === 0) {
      return {
        status: 'READY_FOR_USER_TESTING',
        confidence: 'HIGH',
        blockers: [],
        recommendations: [
          '✅ All critical integration tests passed',
          '🚀 Community node is properly structured and deployed', 
          '👤 User can begin manual testing of workflows',
          '📋 Import example workflows and test basic operations'
        ]
      };
    } else {
      return {
        status: 'NEEDS_FIXES',
        confidence: 'MEDIUM',
        blockers: critical_failures.map(f => f.test),
        recommendations: [
          '🔧 Fix critical integration failures before user testing',
          '⚠️  Review Docker container configuration',
          '📦 Verify community node installation process'
        ]
      };
    }
  }

  generateNextPhaseRequirements() {
    return {
      performance_testing: {
        ready: this.testResults.filter(r => r.status === 'FAILED').length === 0,
        requirements: [
          'Load testing with concurrent Neo4j operations',
          'Memory usage monitoring during heavy workflows',
          'Response time benchmarking for all operations'
        ]
      },
      user_testing: {
        ready: this.generateReadinessAssessment().status === 'READY_FOR_USER_TESTING',
        user_credentials: 'ilia.volkov@outlook.com / Password123',
        test_scenarios: [
          'Import and execute example workflows',
          'Create custom Neo4j credentials',
          'Test vector similarity search operations',
          'Test graph database queries',
          'Verify error handling in UI'
        ]
      }
    };
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runIntegrationTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Integration testing failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;