# 🚀 Neo4j Extended v1.1.0 - Architecture Plan

## 📋 **Требования пользователя:**

### 1. **Автоматизированная обработка документов**
- AI Agent получает chunk документа
- Автоматическое разбиение на графы 
- Добавление в векторное + графовое хранилище одновременно
- Гибридный поиск (вектор + граф) с AI-управлением

### 2. **Управление хранилищем**  
- Удаление графов и векторов по метаданным
- Поддержка обновления документов (MD5 + дата проверки)
- Очистка устаревших данных

### 3. **AI-управляемые операции**
- Автоматический выбор стратегии поиска по контексту
- Генерация Cypher запросов для графов
- Структурирование текста в графы

## 🏗️ **Архитектурное решение**

### **Phase 1: Расширение операций (обратно совместимо)**
```typescript
// Добавить новые операции к существующим:
operations: [
  // Существующие (векторные)
  'similaritySearch', 'addTexts', 'addDocuments',
  // Существующие (графовые)  
  'executeQuery', 'createNode', 'createRelationship', 'getSchema',
  // НОВЫЕ (гибридные)
  'processDocument',     // Авто-обработка документа в граф+вектор
  'hybridSearch',        // Комбинированный поиск
  'cleanByMetadata',     // Очистка по метаданным
  'updateDocument'       // Обновление с проверкой MD5
]
```

### **Phase 2: AI Tool Enhancement**
```typescript
toolOperations: [
  // Существующие
  'vectorSearch', 'graphQuery', 'both',
  // НОВЫЕ
  'documentProcessor',   // AI разбирает документ
  'smartSearch',         // AI выбирает стратегию поиска  
  'graphBuilder'         // AI создает граф структуру
]
```

### **Phase 3: Document Processing Pipeline**
```typescript
processDocument(chunk) {
  1. AI анализирует содержимое
  2. Извлекает сущности и отношения  
  3. Создает граф структуру
  4. Добавляет в векторное хранилище
  5. Создает узлы и связи в графе
  6. Сохраняет метаданные (MD5, дата)
}
```

## 🛠️ **Конкретная реализация**

### **Новые поля в Manual Mode:**
```typescript
// Для processDocument операции
{
  displayName: 'Document Content',
  name: 'documentContent',
  type: 'string',
  rows: 5,
  description: 'Raw document content to process'
},
{
  displayName: 'Extract Entities',
  name: 'extractEntities', 
  type: 'boolean',
  default: true,
  description: 'AI extracts entities for graph nodes'
},
{
  displayName: 'Create Relationships',
  name: 'createRelationships',
  type: 'boolean', 
  default: true,
  description: 'AI creates relationships between entities'
}
```

### **Новые поля для AI Tool Mode:**
```typescript
// $fromAI() интеграция для document processing
{
  displayName: 'Document Content',
  name: 'aiDocumentContent',
  default: '={{ /*n8n-auto-generated-fromAI-override*/ $fromAI("content", "Document content to process and structure", "string") }}',
  description: 'AI can provide document content automatically'
}
```

### **Hybrid Search Logic:**
```typescript
hybridSearch(query, context) {
  // AI анализирует запрос и контекст
  const strategy = analyzeSearchStrategy(query, context);
  
  if (strategy.includes('entities')) {
    // Поиск по графу для сущностей
    const graphResults = await graphQuery(generateCypher(query));
  }
  
  if (strategy.includes('semantic')) {
    // Векторный поиск для семантики
    const vectorResults = await vectorSearch(query);
  }
  
  // Комбинирование и ранжирование результатов
  return combineResults(graphResults, vectorResults);
}
```

## 📊 **Best Practices Research**

### **Document Processing Patterns:**
1. **Chunking**: Оптимальный размер 500-1000 токенов
2. **Entity Extraction**: NER + LLM для структурирования  
3. **Graph Construction**: Иерархические отношения (Document -> Section -> Entity)
4. **Metadata Management**: UUID + MD5 + timestamp для версионирования

### **Hybrid Search Strategies:**
1. **Query Analysis**: Классификация запросов (factual vs semantic)
2. **Result Fusion**: RRF (Reciprocal Rank Fusion) для комбинирования
3. **Context Awareness**: История поиска для улучшения стратегии

## 🎯 **Implementation Plan**

### **Step 1: Extend current stable base**
- Добавить новые операции без изменения существующих
- Сохранить полную обратную совместимость
- Расширить AI Tool режим

### **Step 2: Implement document processing**  
- AI-powered entity extraction
- Graph structure generation
- Hybrid storage (vector + graph)

### **Step 3: Add management operations**
- Metadata-based cleanup
- Document update with MD5 checking
- Version management

### **Step 4: Enhanced AI Tool integration**
- Smart search strategy selection
- $fromAI() for document processing
- Context-aware query generation

## 📦 **Delivery Timeline**

1. **npm publish v1.0.1** - Стабильная база (сейчас)
2. **v1.1.0-beta** - Основные расширения  
3. **v1.1.0** - Полная реализация с тестированием
4. **v1.2.0** - Advanced AI features

**Ready to proceed with implementation after npm publication** ✅