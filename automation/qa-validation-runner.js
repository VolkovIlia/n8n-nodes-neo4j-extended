#!/usr/bin/env node

// QA Validation Specialist - Финальная валидация всех систем
// automation/qa-validation-runner.js

const fs = require('fs').promises;
const path = require('path');

class QAValidationRunner {
  constructor() {
    this.testResults = [];
    this.validationFindings = [];
    this.overallStatus = 'PENDING';
    
    // Load previous test results
    this.isolatedTestResults = null;
    this.integrationTestResults = null;
    this.performanceTestResults = null;
  }

  async runQAValidation() {
    console.log('🛡️  Starting QA Validation Specialist');
    console.log('📋 Final Quality Assurance & System Validation');
    
    try {
      // Phase 1: Load Previous Test Results
      await this.loadPreviousTestResults();
      
      // Phase 2: Comprehensive System Validation
      await this.validateSystemIntegrity();
      
      // Phase 3: User Experience Validation
      await this.validateUserExperience();
      
      // Phase 4: Security & Compliance Check
      await this.validateSecurityCompliance();
      
      // Phase 5: Deployment Readiness Assessment
      await this.assessDeploymentReadiness();
      
      // Phase 6: Generate Final QA Report
      await this.generateFinalQAReport();
      
      this.overallStatus = 'PASSED';
      console.log('✅ QA Validation COMPLETED');
      
    } catch (error) {
      this.overallStatus = 'FAILED';
      console.log('❌ QA Validation FAILED:', error.message);
    }
  }

  async loadPreviousTestResults() {
    console.log('📂 Phase 1: Loading Previous Test Results');
    
    try {
      // Find latest test reports
      const reportsDir = './docs/reports';
      const files = await fs.readdir(reportsDir);
      
      const isolatedFile = files
        .filter(f => f.startsWith('isolated-test-'))
        .sort()
        .pop();
      
      const integrationFile = files
        .filter(f => f.startsWith('integration-test-'))
        .sort()
        .pop();
        
      const performanceFile = files
        .filter(f => f.startsWith('performance-test-'))
        .sort()
        .pop();
      
      if (isolatedFile) {
        const data = await fs.readFile(path.join(reportsDir, isolatedFile), 'utf8');
        this.isolatedTestResults = JSON.parse(data);
        console.log(`✅ Isolated Test Results: ${isolatedFile}`);
      }
      
      if (integrationFile) {
        const data = await fs.readFile(path.join(reportsDir, integrationFile), 'utf8');
        this.integrationTestResults = JSON.parse(data);
        console.log(`✅ Integration Test Results: ${integrationFile}`);
      }
      
      if (performanceFile) {
        const data = await fs.readFile(path.join(reportsDir, performanceFile), 'utf8');
        this.performanceTestResults = JSON.parse(data);
        console.log(`✅ Performance Test Results: ${performanceFile}`);
      }
      
    } catch (error) {
      this.validationFindings.push({
        severity: 'WARNING',
        category: 'test_results',
        issue: 'Could not load all previous test results',
        details: error.message
      });
      console.log(`⚠️  Test Results Loading: ${error.message}`);
    }
  }

  async validateSystemIntegrity() {
    console.log('🔍 Phase 2: System Integrity Validation');
    
    // Validate isolated test results
    if (this.isolatedTestResults) {
      const isolatedPassed = this.isolatedTestResults.summary.passed;
      const isolatedTotal = this.isolatedTestResults.summary.total_tests;
      const isolatedPassRate = (isolatedPassed / isolatedTotal) * 100;
      
      if (isolatedPassRate >= 80) {
        this.testResults.push({
          test: 'isolated_testing_validation',
          status: 'PASSED',
          details: `${isolatedPassed}/${isolatedTotal} tests passed (${isolatedPassRate.toFixed(1)}%)`
        });
        console.log(`✅ Isolated Tests: ${isolatedPassRate.toFixed(1)}% pass rate`);
      } else {
        this.testResults.push({
          test: 'isolated_testing_validation',
          status: 'FAILED',
          details: `Low pass rate: ${isolatedPassRate.toFixed(1)}%`
        });
        this.validationFindings.push({
          severity: 'HIGH',
          category: 'system_integrity',
          issue: 'Isolated testing has low pass rate',
          details: `Only ${isolatedPassRate.toFixed(1)}% of isolated tests passed`
        });
        console.log(`❌ Isolated Tests: ${isolatedPassRate.toFixed(1)}% pass rate - TOO LOW`);
      }
    }
    
    // Validate integration test results
    if (this.integrationTestResults) {
      const readinessAssessment = this.integrationTestResults.readiness_assessment;
      
      if (readinessAssessment && readinessAssessment.status === 'READY_FOR_USER_TESTING') {
        this.testResults.push({
          test: 'integration_readiness_validation',
          status: 'PASSED',
          details: 'Integration testing confirms readiness for user testing'
        });
        console.log('✅ Integration Readiness: READY FOR USER TESTING');
      } else {
        this.testResults.push({
          test: 'integration_readiness_validation', 
          status: 'FAILED',
          details: 'Integration testing indicates system not ready'
        });
        this.validationFindings.push({
          severity: 'CRITICAL',
          category: 'system_integrity',
          issue: 'System not ready for user testing',
          details: readinessAssessment?.recommendations?.join(', ') || 'Unknown issues'
        });
        console.log('❌ Integration Readiness: NOT READY');
      }
    }
    
    // Validate performance test results
    if (this.performanceTestResults) {
      const perfAssessment = this.performanceTestResults.performance_assessment;
      
      if (perfAssessment && perfAssessment.ready_for_production) {
        this.testResults.push({
          test: 'performance_validation',
          status: 'PASSED',
          details: `Performance score: ${perfAssessment.overall_score}/100`
        });
        console.log(`✅ Performance: ${perfAssessment.overall_score}/100 - ${perfAssessment.rating}`);
      } else {
        this.testResults.push({
          test: 'performance_validation',
          status: 'WARNING',
          details: `Performance needs attention: ${perfAssessment?.rating}`
        });
        this.validationFindings.push({
          severity: 'MEDIUM',
          category: 'performance',
          issue: 'Performance may need optimization',
          details: perfAssessment?.issues?.join(', ') || 'Performance below optimal levels'
        });
        console.log(`⚠️  Performance: Needs attention - ${perfAssessment?.rating}`);
      }
    }
  }

  async validateUserExperience() {
    console.log('👤 Phase 3: User Experience Validation');
    
    // Check example workflows
    const exampleWorkflows = [
      '../examples/ai-agent-vector-search.json',
      '../examples/graph-operations.json', 
      '../examples/hybrid-vector-graph.json'
    ];
    
    let validWorkflows = 0;
    
    for (const workflowPath of exampleWorkflows) {
      try {
        const workflowData = JSON.parse(await fs.readFile(workflowPath, 'utf8'));
        
        // Validate workflow structure
        if (workflowData.nodes && workflowData.connections) {
          
          // Check for Neo4j nodes
          const neo4jNodes = workflowData.nodes.filter(node => 
            node.type === 'n8n-nodes-neo4j-extended.neo4j'
          );
          
          if (neo4jNodes.length > 0) {
            validWorkflows++;
            
            // Validate node configurations
            const validConfigurations = neo4jNodes.every(node => 
              node.parameters && 
              (node.parameters.resource || node.parameters.operation)
            );
            
            if (validConfigurations) {
              console.log(`✅ Workflow "${workflowData.name}": ${neo4jNodes.length} valid Neo4j nodes`);
            } else {
              this.validationFindings.push({
                severity: 'MEDIUM',
                category: 'user_experience',
                issue: 'Workflow has incomplete node configurations',
                details: `Workflow: ${workflowData.name}`
              });
              console.log(`⚠️  Workflow "${workflowData.name}": Some nodes have incomplete config`);
            }
          }
        }
        
      } catch (error) {
        this.validationFindings.push({
          severity: 'HIGH',
          category: 'user_experience',
          issue: 'Cannot load example workflow',
          details: `${workflowPath}: ${error.message}`
        });
        console.log(`❌ Workflow Load Error: ${path.basename(workflowPath)}`);
      }
    }
    
    this.testResults.push({
      test: 'example_workflows_validation',
      status: validWorkflows >= 2 ? 'PASSED' : 'FAILED',
      details: `${validWorkflows}/${exampleWorkflows.length} workflows valid`
    });
    
    // Check documentation completeness
    const docFiles = [
      '../README.md',
      '../QUICKSTART.md', 
      '../TESTING.md',
      '../PROJECT_COMPLETION.md'
    ];
    
    let validDocs = 0;
    
    for (const docPath of docFiles) {
      try {
        const content = await fs.readFile(docPath, 'utf8');
        if (content.length > 500) { // Basic content check
          validDocs++;
          console.log(`✅ Documentation: ${path.basename(docPath)}`);
        } else {
          console.log(`⚠️  Documentation: ${path.basename(docPath)} may be incomplete`);
        }
      } catch (error) {
        this.validationFindings.push({
          severity: 'MEDIUM',
          category: 'user_experience',
          issue: 'Missing documentation',
          details: `${docPath} not found`
        });
        console.log(`❌ Documentation: ${path.basename(docPath)} missing`);
      }
    }
    
    this.testResults.push({
      test: 'documentation_completeness',
      status: validDocs >= 3 ? 'PASSED' : 'WARNING',
      details: `${validDocs}/${docFiles.length} documentation files complete`
    });
  }

  async validateSecurityCompliance() {
    console.log('🔒 Phase 4: Security & Compliance Validation');
    
    // Check package.json for security issues
    try {
      const packagePath = '../package.json';
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      // Check for security-related configs
      const securityChecks = {
        hasLockFile: false,
        dependencies: packageData.dependencies || {},
        devDependencies: packageData.devDependencies || {},
        scripts: packageData.scripts || {}
      };
      
      // Check for package-lock.json
      try {
        await fs.access('../package-lock.json');
        securityChecks.hasLockFile = true;
      } catch {}
      
      // Validate dependencies
      const criticalDeps = ['neo4j-driver', '@langchain/community'];
      const missingDeps = criticalDeps.filter(dep => 
        !securityChecks.dependencies[dep] && !securityChecks.devDependencies[dep]
      );
      
      if (missingDeps.length === 0) {
        this.testResults.push({
          test: 'critical_dependencies',
          status: 'PASSED',
          details: 'All critical dependencies present'
        });
        console.log('✅ Dependencies: All critical dependencies present');
      } else {
        this.testResults.push({
          test: 'critical_dependencies',
          status: 'FAILED',
          details: `Missing: ${missingDeps.join(', ')}`
        });
        this.validationFindings.push({
          severity: 'CRITICAL',
          category: 'security',
          issue: 'Missing critical dependencies',
          details: `Missing dependencies: ${missingDeps.join(', ')}`
        });
        console.log(`❌ Dependencies: Missing ${missingDeps.join(', ')}`);
      }
      
      // Check for test scripts
      if (securityChecks.scripts.test || securityChecks.scripts.build) {
        this.testResults.push({
          test: 'build_scripts_present',
          status: 'PASSED',
          details: 'Build and test scripts configured'
        });
        console.log('✅ Scripts: Build/test scripts present');
      } else {
        this.validationFindings.push({
          severity: 'LOW',
          category: 'compliance',
          issue: 'Missing test scripts',
          details: 'No test or build scripts in package.json'
        });
        console.log('⚠️  Scripts: No test scripts found');
      }
      
    } catch (error) {
      this.validationFindings.push({
        severity: 'HIGH',
        category: 'security',
        issue: 'Cannot validate package.json',
        details: error.message
      });
      console.log(`❌ Package Validation: ${error.message}`);
    }
  }

  async assessDeploymentReadiness() {
    console.log('🚀 Phase 5: Deployment Readiness Assessment');
    
    const deploymentCriteria = {
      isolatedTestsPass: false,
      integrationReady: false,
      performanceAcceptable: false,
      workflowsValid: false,
      documentationComplete: false,
      securityCompliant: true // Assume compliant unless issues found
    };
    
    // Check isolated tests
    if (this.isolatedTestResults && this.isolatedTestResults.summary.passed >= 8) {
      deploymentCriteria.isolatedTestsPass = true;
    }
    
    // Check integration readiness
    if (this.integrationTestResults && 
        this.integrationTestResults.readiness_assessment?.status === 'READY_FOR_USER_TESTING') {
      deploymentCriteria.integrationReady = true;
    }
    
    // Check performance
    if (this.performanceTestResults && 
        this.performanceTestResults.performance_assessment?.ready_for_production) {
      deploymentCriteria.performanceAcceptable = true;
    }
    
    // Check workflows
    const workflowTests = this.testResults.find(t => t.test === 'example_workflows_validation');
    if (workflowTests && workflowTests.status === 'PASSED') {
      deploymentCriteria.workflowsValid = true;
    }
    
    // Check documentation
    const docTests = this.testResults.find(t => t.test === 'documentation_completeness');
    if (docTests && (docTests.status === 'PASSED' || docTests.status === 'WARNING')) {
      deploymentCriteria.documentationComplete = true;
    }
    
    // Check for critical security issues
    const criticalSecurityIssues = this.validationFindings.filter(f => 
      f.severity === 'CRITICAL' && f.category === 'security'
    );
    if (criticalSecurityIssues.length > 0) {
      deploymentCriteria.securityCompliant = false;
    }
    
    const passedCriteria = Object.values(deploymentCriteria).filter(Boolean).length;
    const totalCriteria = Object.keys(deploymentCriteria).length;
    const readinessScore = (passedCriteria / totalCriteria) * 100;
    
    let readinessStatus;
    if (readinessScore >= 90) {
      readinessStatus = 'READY_FOR_PRODUCTION';
    } else if (readinessScore >= 75) {
      readinessStatus = 'READY_FOR_USER_TESTING';
    } else if (readinessScore >= 60) {
      readinessStatus = 'NEEDS_MINOR_FIXES';
    } else {
      readinessStatus = 'NEEDS_MAJOR_FIXES';
    }
    
    this.testResults.push({
      test: 'deployment_readiness_assessment',
      status: readinessScore >= 75 ? 'PASSED' : 'FAILED',
      details: `${readinessScore.toFixed(1)}% ready (${passedCriteria}/${totalCriteria} criteria met)`,
      readiness_status: readinessStatus
    });
    
    console.log(`🎯 Deployment Readiness: ${readinessScore.toFixed(1)}% - ${readinessStatus}`);
    
    // Log specific criteria
    Object.entries(deploymentCriteria).forEach(([criteria, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${criteria}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
  }

  async generateFinalQAReport() {
    console.log('📊 Phase 6: Final QA Report');
    
    const criticalIssues = this.validationFindings.filter(f => f.severity === 'CRITICAL');
    const highIssues = this.validationFindings.filter(f => f.severity === 'HIGH');
    const mediumIssues = this.validationFindings.filter(f => f.severity === 'MEDIUM');
    
    const overallAssessment = this.generateOverallAssessment();
    
    const report = {
      timestamp: new Date().toISOString(),
      test_phase: 'qa_validation',
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASSED').length,
        failed: this.testResults.filter(r => r.status === 'FAILED').length,
        warnings: this.testResults.filter(r => r.status === 'WARNING').length
      },
      validation_findings: {
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: this.validationFindings.filter(f => f.severity === 'LOW').length,
        details: this.validationFindings
      },
      test_results: this.testResults,
      overall_assessment: overallAssessment,
      user_testing_clearance: this.generateUserTestingClearance(),
      final_recommendations: this.generateFinalRecommendations()
    };

    await fs.mkdir('./docs/reports', { recursive: true });
    const reportPath = `./docs/reports/qa-validation-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 QA Report: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
    console.log(`🔍 Issues: ${criticalIssues.length} critical, ${highIssues.length} high, ${mediumIssues.length} medium`);
    
    return report;
  }

  generateOverallAssessment() {
    const criticalIssues = this.validationFindings.filter(f => f.severity === 'CRITICAL');
    const highIssues = this.validationFindings.filter(f => f.severity === 'HIGH');
    
    const deploymentTest = this.testResults.find(t => t.test === 'deployment_readiness_assessment');
    const readinessStatus = deploymentTest?.readiness_status || 'UNKNOWN';
    
    if (criticalIssues.length > 0) {
      return {
        status: 'CRITICAL_ISSUES_FOUND',
        confidence: 'LOW',
        recommendation: 'DO_NOT_RELEASE',
        summary: 'Critical issues must be resolved before any user testing'
      };
    } else if (highIssues.length > 2) {
      return {
        status: 'MULTIPLE_HIGH_ISSUES',
        confidence: 'MEDIUM',
        recommendation: 'RESOLVE_BEFORE_RELEASE',
        summary: 'Multiple high-severity issues should be addressed'
      };
    } else if (readinessStatus === 'READY_FOR_PRODUCTION') {
      return {
        status: 'PRODUCTION_READY',
        confidence: 'HIGH',
        recommendation: 'CLEARED_FOR_PRODUCTION',
        summary: 'System meets all quality criteria for production deployment'
      };
    } else if (readinessStatus === 'READY_FOR_USER_TESTING') {
      return {
        status: 'USER_TESTING_APPROVED',
        confidence: 'HIGH', 
        recommendation: 'CLEARED_FOR_USER_TESTING',
        summary: 'System ready for user acceptance testing'
      };
    } else {
      return {
        status: 'NEEDS_IMPROVEMENT',
        confidence: 'MEDIUM',
        recommendation: 'ADDRESS_ISSUES_FIRST',
        summary: 'Some issues should be addressed before user testing'
      };
    }
  }

  generateUserTestingClearance() {
    const overallAssessment = this.generateOverallAssessment();
    
    if (overallAssessment.recommendation === 'CLEARED_FOR_USER_TESTING' ||
        overallAssessment.recommendation === 'CLEARED_FOR_PRODUCTION') {
      
      return {
        status: 'APPROVED',
        clearance_level: 'FULL_ACCESS',
        user_credentials: 'ilia.volkov@outlook.com / Password123',
        testing_environment: {
          n8n_url: 'http://localhost:5678',
          neo4j_browser: 'http://localhost:7474',
          neo4j_credentials: 'neo4j / password123'
        },
        recommended_tests: [
          'Import and execute example workflows',
          'Create custom Neo4j credentials in n8n',
          'Test vector similarity search operations', 
          'Test graph database queries',
          'Verify error handling in UI'
        ],
        precautions: []
      };
    } else {
      return {
        status: 'CONDITIONAL_APPROVAL',
        clearance_level: 'LIMITED_TESTING',
        conditions: this.validationFindings
          .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
          .map(f => f.issue),
        recommended_actions: [
          'Review critical and high-severity issues',
          'Test basic functionality only',
          'Report any additional issues found'
        ]
      };
    }
  }

  generateFinalRecommendations() {
    const recommendations = [];
    
    const deploymentTest = this.testResults.find(t => t.test === 'deployment_readiness_assessment');
    
    if (deploymentTest?.readiness_status === 'READY_FOR_PRODUCTION') {
      recommendations.push('✅ System is ready for production deployment');
      recommendations.push('📊 All quality gates passed successfully');
      recommendations.push('👤 User can begin comprehensive testing');
    } else if (deploymentTest?.readiness_status === 'READY_FOR_USER_TESTING') {
      recommendations.push('✅ System approved for user acceptance testing');
      recommendations.push('📋 Monitor user feedback for any additional issues');
      recommendations.push('🔍 Address minor issues found during user testing');
    } else {
      recommendations.push('🔧 Address identified issues before user testing');
      recommendations.push('📈 Re-run validation after fixes');
      recommendations.push('⚡ Focus on critical and high-priority issues first');
    }
    
    // Add specific recommendations based on findings
    if (this.validationFindings.some(f => f.category === 'performance')) {
      recommendations.push('⚡ Monitor performance during user testing');
    }
    
    if (this.validationFindings.some(f => f.category === 'security')) {
      recommendations.push('🔒 Review security configurations before deployment');
    }
    
    return recommendations;
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new QAValidationRunner();
  runner.runQAValidation().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 QA validation failed:', error);
    process.exit(1);
  });
}

module.exports = QAValidationRunner;