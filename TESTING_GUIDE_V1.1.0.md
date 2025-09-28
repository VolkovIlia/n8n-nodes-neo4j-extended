# 🧪 Neo4j Extended v1.1.0 - Testing Guide

## 🚀 **Quick Test Setup**

### **Prerequisites:**
- ✅ Neo4j container running (`docker ps` shows neo4j-test)
- ✅ n8n container running (`docker ps` shows n8n-test)
- ✅ Vector index created in Neo4j
- ✅ v1.1.0 compiled and deployed

### **Access Points:**
- **n8n Interface**: http://localhost:5678
- **Neo4j Browser**: http://localhost:7474
- **Neo4j Credentials**: neo4j/password123

---

## 📋 **Test Plan v1.1.0**

### **Test 1: Process Document Operation**
```json
{
  "mode": "manual",
  "resource": "vectorStore", 
  "operation": "processDocument",
  "documentContent": "This is a test document about artificial intelligence and machine learning. Neo4j is a graph database that can store relationships between entities like persons, organizations, and concepts.",
  "documentTitle": "AI and Neo4j Test Document",
  "extractEntities": true,
  "createRelationships": true
}
```

**Expected Result:**
- Document chunked and added to vector store
- Entities extracted and added to graph
- Success response with processing statistics

### **Test 2: Hybrid Search Operation**
```json
{
  "mode": "manual", 
  "resource": "vectorStore",
  "operation": "hybridSearch",
  "hybridQuery": "artificial intelligence machine learning",
  "searchContext": "looking for technical concepts"
}
```

**Expected Result:**
- AI analyzes query and selects search strategy
- Combined results from vector and graph search
- Ranked results with source attribution

### **Test 3: Clean by Metadata Operation**
```json
{
  "mode": "manual",
  "resource": "vectorStore", 
  "operation": "cleanByMetadata",
  "metadataCriteria": {
    "type": "document_chunk",
    "title": "AI and Neo4j Test Document"
  }
}
```

**Expected Result:**
- Documents matching criteria removed from both stores
- Success response with deletion count

### **Test 4: Update Document Operation**
```json
{
  "mode": "manual",
  "resource": "vectorStore",
  "operation": "updateDocument", 
  "documentId": "test-doc-1",
  "newContent": "Updated content for the test document with new information about graph databases and vector search.",
  "checkMD5": true
}
```

**Expected Result:**
- Document updated with version checking
- MD5 hash calculated and compared
- Success response with update status

---

## 🤖 **AI Tool Mode Tests**

### **Test 5: AI Agent with New Operations**
```json
{
  "mode": "retrieve-as-tool",
  "toolOperation": "documentProcessor",
  // Connected to AI Agent that provides document content
}
```

**Expected Result:**
- AI Agent can use document processor tool
- Documents processed automatically with AI analysis
- Tool appears in AI Agent's available functions

### **Test 6: Smart Search Tool**
```json
{
  "mode": "retrieve-as-tool", 
  "toolOperation": "smartSearch",
  // Connected to AI Agent for intelligent search
}
```

**Expected Result:**
- AI Agent can use smart search tool
- Search strategy selected based on query context
- Intelligent result ranking and presentation

---

## 🔍 **Manual Verification Steps**

### **Step 1: Check New Operations in UI**
1. Open n8n at http://localhost:5678
2. Create new workflow
3. Add Neo4j node
4. Set mode to "Manual"
5. Set resource to "Vector Store" 
6. Verify new operations appear:
   - ✅ Process Document
   - ✅ Hybrid Search
   - ✅ Clean by Metadata
   - ✅ Update Document

### **Step 2: Check AI Tool Operations**
1. Set mode to "AI Tool"
2. Verify new tool operations appear:
   - ✅ Document Processor
   - ✅ Smart Search  
   - ✅ Graph Builder

### **Step 3: Neo4j Database Verification**
```cypher
// Check document nodes created
MATCH (d:Document) RETURN d LIMIT 10

// Check vector index
SHOW INDEXES YIELD name, type WHERE name = 'vector_index'

// Check relationships
MATCH ()-[r]-() RETURN type(r), count(*) as count
```

---

## 🎯 **Success Criteria**

### **Functional Requirements:**
- ✅ All new operations compile and load without errors
- ✅ New parameters appear in n8n UI with proper validation
- ✅ Operations execute without throwing exceptions
- ✅ Data is properly stored in both vector and graph stores
- ✅ Hybrid search returns combined results

### **Compatibility Requirements:**
- ✅ All existing v1.0.x operations work unchanged
- ✅ Existing workflows continue to function
- ✅ No breaking changes in API or behavior
- ✅ Backward compatibility maintained

### **Performance Requirements:**
- ✅ Document processing completes within reasonable time
- ✅ Hybrid search performs better than individual searches
- ✅ Memory usage remains stable during operations

---

## 🐛 **Known Limitations**

### **Current Implementation:**
- Entity extraction uses simple heuristics (not full LLM integration)
- Graph structure generation is basic (placeholder for AI enhancement)
- Search strategy selection uses rule-based approach
- Cypher generation is template-based

### **Future Enhancements:**
- Full LLM integration for entity extraction
- Advanced graph structure generation
- Machine learning-based search strategy selection
- Dynamic Cypher generation with AI

---

**🚀 Ready to test the revolutionary Neo4j v1.1.0 with AI-powered document processing!**