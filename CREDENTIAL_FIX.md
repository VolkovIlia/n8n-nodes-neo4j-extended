# 🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ ПОДКЛЮЧЕНИЯ К NEO4J

## ❌ **ПРОБЛЕМА НАЙДЕНА**

Ваши настройки credentials не работают из-за неправильного формата URI для Neo4j в контейнере Docker.

## ✅ **ПРАВИЛЬНЫЕ НАСТРОЙКИ NEO4J CREDENTIALS**

### **Для Neo4j в Docker Container:**
- **Connection URI**: `neo4j://neo4j-test:7687` (имя контейнера!)
- **Username**: `neo4j`  
- **Password**: `password123`
- **Database**: `neo4j`

### **Альтернативные варианты URI:**
1. `neo4j://neo4j-test:7687` (рекомендуется - имя контейнера)
2. `neo4j://host.docker.internal:7687` (если предыдущий не работает)
3. `bolt://neo4j-test:7687` (Bolt протокол)

## 🏃‍♂️ **ПОШАГОВАЯ ИНСТРУКЦИЯ**

### **Шаг 1: Обновите Neo4j Credentials в n8n**
1. Откройте http://localhost:5678
2. Войдите: `ilia.volkov@outlook.com` / `Password123`
3. Идите в **Settings** → **Credentials**  
4. Найдите **"Neo4j account"** credential
5. Замените **Connection URI** на: `neo4j://neo4j-test:7687`
6. Убедитесь: Username=`neo4j`, Password=`password123`, Database=`neo4j`
7. **Нажмите "Test Connection"** - должно пройти успешно!

### **Шаг 2: Тестовые документы готовы**
Созданы 5 файлов в папке `test-documents/`:
- `document1.txt` - о Neo4j базе данных
- `document2.txt` - о векторном поиске  
- `document3.txt` - о платформе n8n
- `document4.txt` - о фреймворке LangChain
- `document5.txt` - об AI агентах

## 🚀 **ТЕСТИРОВАНИЕ WORKFLOW**

### **1. Загрузка документов в векторное хранилище:**
- Используйте trigger **"On form submission"** 
- Загрузите любой из текстовых файлов из `test-documents/`
- Node **"Add texts to vector store"** добавит их в Neo4j

### **2. Тестирование AI Agent с векторным поиском:**
- Используйте **"When chat message received"** trigger
- Задайте вопрос: "Расскажи про Neo4j" 
- AI Agent будет использовать **"Search for similar vectors"** для поиска релевантной информации

### **3. Cypher запросы:**
- Node **"Execute cypher query"** может выполнять любые Cypher команды
- Например: `MATCH (n) RETURN count(n) as total_nodes`

## 🔍 **ДИАГНОСТИКА ЕСЛИ НЕ РАБОТАЕТ**

### **Проверьте сетевое подключение:**
```bash
docker exec -it n8n-test ping neo4j-test
```

### **Проверьте Neo4j доступность:**
```bash  
docker exec -it neo4j-test cypher-shell -u neo4j -p password123 "RETURN 1"
```

## ⚠️ **ВАЖНЫЕ ЗАМЕЧАНИЯ**

1. **Обязательно используйте имя контейнера `neo4j-test`** в URI
2. **Не используйте localhost** - это не работает между контейнерами
3. **Проверьте, что оба контейнера запущены** (`docker ps`)
4. **API Key от n8n** не влияет на Neo4j подключение

---

**После исправления credentials ваш workflow должен работать корректно!** 🎉