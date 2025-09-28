# 🎯 ПРАВИЛЬНЫЕ CYPHER ЗАПРОСЫ ДЛЯ ТЕСТИРОВАНИЯ

## ✅ **БАЗОВЫЕ ТЕСТОВЫЕ ЗАПРОСЫ:**

### **1. Простая проверка соединения:**
```cypher
RETURN 'Connection successful!' as status
```

### **2. Проверка с датой:**
```cypher
RETURN 'Neo4j is working!' as message, datetime() as current_time
```

### **3. Проверка базы данных:**
```cypher
CALL db.info() YIELD name, edition RETURN name, edition
```

### **4. Подсчёт всех узлов:**
```cypher
MATCH (n) RETURN count(n) as total_nodes
```

### **5. Список всех меток:**
```cypher
CALL db.labels() YIELD label RETURN label
```

## ❌ **НЕПРАВИЛЬНЫЕ ЗАПРОСЫ:**

- ❌ `test` - не Cypher команда
- ❌ `hello` - не валидный синтаксис  
- ❌ `connection` - не команда

## 📋 **ПОШАГОВОЕ ТЕСТИРОВАНИЕ CREDENTIALS:**

### **Шаг 1: Импорт workflow**
- Используйте `examples/quick-connection-test.json`
- Или `examples/credential-test-workflow.json`

### **Шаг 2: Настройка credentials**
- **Settings** → **Credentials** → **"Neo4j API (Extended)"**
- **Connection URI**: `bolt://neo4j-test:7687`
- **Username**: `neo4j`
- **Password**: `password123`
- **Database**: `neo4j`

### **Шаг 3: Выбор credentials в workflow**
- Кликните на Neo4j node
- **Credentials** → выберите созданный credential
- **Save**

### **Шаг 4: Выполнение теста**
- **Execute Workflow**
- **Ожидаемый результат**: `"Connection successful!"`

## 🔍 **ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ:**

### **Тест векторных возможностей:**
```cypher
CALL gds.version() YIELD gdsVersion RETURN gdsVersion
```

### **Тест APOC функций:**
```cypher
RETURN apoc.version() as apocVersion
```

### **Создание тестового узла:**
```cypher
CREATE (t:TestNode {name: 'Connection Test', created: datetime()}) RETURN t
```

### **Удаление тестовых узлов:**
```cypher
MATCH (t:TestNode) DELETE t
```

---
**Используйте эти запросы для правильного тестирования Neo4j соединения!**