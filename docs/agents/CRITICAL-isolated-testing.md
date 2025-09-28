# КРИТИЧЕСКОЕ ЗАДАНИЕ - Isolated Testing Specialist

## 🚨 СРОЧНОЕ АВТОМАТИЗИРОВАННОЕ ТЕСТИРОВАНИЕ

### Статус инфраструктуры: ✅ ГОТОВА
- Neo4j: Running with test data (17 nodes, 4 types)  
- n8n: Custom build with neo4j-driver dependency  
- Community node: Mounted and ready for testing
- User created: ilia.volkov@outlook.com / Password123

### Phase 1: НЕМЕДЛЕННЫЕ АВТОМАТИЧЕСКИЕ ТЕСТЫ

#### A. Node Discovery Test
```javascript
// Проверка, что n8n видит наш Neo4j node
const testNodeDiscovery = async () => {
  const response = await fetch('http://localhost:5678/types/nodes');
  const nodes = await response.json();
  
  const neo4jNode = nodes.find(node => 
    node.name === 'n8n-nodes-neo4j-extended.neo4j'
  );
  
  assert(neo4jNode, 'Neo4j node должен быть доступен в n8n');
  console.log('✅ Node Discovery: PASSED');
}
```

#### B. Credential Connection Test  
```javascript
// Автоматическое тестирование подключения к Neo4j
const testCredentialConnection = async () => {
  const credentials = {
    uri: 'bolt://neo4j:7687',
    username: 'neo4j', 
    password: 'password123',
    database: 'neo4j'
  };
  
  // Test через n8n API
  const connectionTest = await testCredential(credentials);
  assert(connectionTest.success, 'Neo4j connection должно работать');
  console.log('✅ Credential Test: PASSED');
}
```

#### C. Basic Operations Test Suite
```javascript
const automatedTestSuite = {
  
  // Vector Store Operations
  vectorStoreTests: [
    {
      name: 'similaritySearch_basic',
      operation: 'similaritySearch',
      params: { query: 'machine learning', k: 3 },
      expected: { resultCount: 3, hasScores: true }
    },
    {
      name: 'addTexts_single',
      operation: 'addTexts', 
      params: { 
        texts: ['Test document for vector search'],
        metadatas: [{ category: 'test', id: 'test_001' }]
      },
      expected: { success: true }
    }
  ],
  
  // Graph Database Operations  
  graphDbTests: [
    {
      name: 'executeQuery_basic',
      operation: 'executeQuery',
      params: { 
        cypherQuery: 'MATCH (p:Person) RETURN count(p) as person_count',
        queryParameters: '{}'
      },
      expected: { person_count: 6 }
    },
    {
      name: 'createNode_test',
      operation: 'createNode',
      params: {
        nodeLabel: 'TestNode',
        nodeProperties: '{"name": "AutoTest", "created": "2025-09-28"}'
      },
      expected: { success: true }
    },
    {
      name: 'getSchema_validation',
      operation: 'getSchema',
      params: { schemaFormat: 'structured' },
      expected: { hasNodeTypes: true, hasRelationships: true }
    }
  ],
  
  // Error Handling Tests
  errorHandlingTests: [
    {
      name: 'invalid_cypher_query',
      operation: 'executeQuery', 
      params: { cypherQuery: 'INVALID CYPHER SYNTAX' },
      expected: { error: true, gracefulFailure: true }
    },
    {
      name: 'connection_timeout',
      operation: 'similaritySearch',
      params: { query: 'test', timeout: 1 }, // 1ms timeout
      expected: { error: true, timeout: true }
    }
  ]
}
```

### Phase 2: AUTOMATED EXECUTION PIPELINE

#### Test Runner Script
```javascript
// automation/isolated-test-runner.js
const testRunner = {
  
  async runAllTests() {
    console.log('🚀 Starting Isolated Testing...');
    
    // 1. Environment Validation
    await this.validateEnvironment();
    
    // 2. Node Discovery
    await this.testNodeDiscovery();
    
    // 3. Credential Testing  
    await this.testCredentials();
    
    // 4. Operations Testing
    await this.runOperationTests();
    
    // 5. Performance Testing
    await this.runPerformanceTests();
    
    // 6. Error Handling
    await this.testErrorHandling();
    
    // 7. Generate Report
    await this.generateReport();
  },
  
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'isolated_docker',
      results: this.testResults,
      performance: this.performanceMetrics,
      errors: this.errorLog,
      status: this.overallStatus
    };
    
    // Save to docs/reports/
    await this.saveReport(report);
    console.log('📊 Test Report Generated');
  }
}
```

### Phase 3: IMMEDIATE VALIDATION REQUIREMENTS

#### Critical Success Criteria (MUST PASS):
- [ ] n8n recognizes Neo4j community node ✅
- [ ] Neo4j credentials connect successfully ✅ 
- [ ] Basic graph query executes without errors
- [ ] Vector similarity search returns results
- [ ] Error handling doesn't crash n8n
- [ ] Memory usage stays under 1GB
- [ ] Response times under 5 seconds for basic operations

#### Performance Benchmarks:
- Graph queries: < 100ms for simple MATCH
- Vector search: < 500ms for 1K documents
- Node creation: < 50ms per operation
- Schema retrieval: < 200ms

### Phase 4: HANDOFF CRITERIA

После успешного прохождения изолированного тестирования:

✅ **HANDOFF TO Integration Testing Specialist**:
- Все базовые операции валидированы
- Performance benchmarks установлены
- Error handling протестирован
- Environment готов для end-to-end testing

✅ **HANDOFF TO Performance Testing Specialist**:
- Baseline metrics собраны
- Нагрузочное тестирование может начинаться
- Concurrent operations готовы к проверке

## 🚨 СТАТУС: КРИТИЧЕСКАЯ СРОЧНОСТЬ
Автоматизированное изолированное тестирование должно быть выполнено НЕМЕДЛЕННО перед любым ручным тестированием пользователем.