# 🚀 Changelog - n8n-nodes-neo4j-extended

## [1.1.0] - 2024-09-29

### ✨ **NEW FEATURES - AI-Powered Document Processing**

#### 📄 **New Vector Store Operations:**
- **Process Document** - AI-powered document processing into graph and vector storage
  - Automatic text chunking (configurable chunk size)
  - Entity extraction with AI analysis
  - Relationship creation between entities
  - Hybrid storage (vector + graph) with metadata
  
- **Hybrid Search** - Combined vector and graph search with AI strategy selection
  - Context-aware search strategy selection
  - Combines vector similarity search with graph traversal
  - Intelligent result ranking and fusion
  
- **Clean by Metadata** - Remove documents by metadata criteria
  - Flexible JSON-based criteria matching
  - Batch deletion from both vector store and graph
  - Safe cleanup with transaction support
  
- **Update Document** - Update document with MD5 and date checking
  - Version control with MD5 hash checking
  - Incremental updates with change detection
  - Automatic metadata timestamping

#### 🤖 **New AI Tool Operations:**
- **Document Processor** - AI processes documents into graph and vector storage
- **Smart Search** - AI automatically selects optimal search strategy
- **Graph Builder** - AI creates graph structures from text content

### 🔧 **Technical Enhancements**

#### **Document Processing Pipeline:**
- **AI Entity Extraction**: Automatic identification of entities and relationships
- **Graph Structure Generation**: Creates hierarchical Document → Section → Entity relationships
- **Metadata Management**: UUID + MD5 + timestamp versioning system
- **Hybrid Storage**: Simultaneous vector and graph storage with cross-referencing

#### **Search Strategy Intelligence:**
- **Query Analysis**: Classifies queries (factual vs semantic vs entity-based)
- **Context Awareness**: Uses search context for better strategy selection
- **Result Fusion**: Combines vector and graph results with intelligent ranking

#### **Version Management:**
- **MD5 Hashing**: Content change detection for updates
- **Timestamp Tracking**: Creation and modification time tracking
- **Metadata Cleanup**: Bulk operations for data lifecycle management

### 🎯 **AI Tool Integration Enhancements**

#### **Enhanced Embedding Support:**
- Extended embedding input detection for new operations
- Support for `documentProcessor`, `smartSearch`, and `graphBuilder` operations
- Improved AI Agent integration with dynamic tool capabilities

#### **Parameter Validation:**
- Rich parameter sets for all new operations
- Context-aware parameter visibility
- Enhanced error handling and validation

### 🏗️ **Architecture Improvements**

#### **Modular Design:**
- Separation of concerns with dedicated helper methods
- Clean abstraction between vector and graph operations  
- Extensible architecture for future AI enhancements

#### **Error Handling:**
- Application-specific error types (`ApplicationError`)
- Detailed error messages with context
- Graceful degradation for partial failures

### 🔄 **Backward Compatibility**
- ✅ **100% Compatible** with all existing v1.0.x operations
- ✅ All existing Manual Mode operations unchanged
- ✅ All existing AI Tool Mode operations unchanged
- ✅ No breaking changes to existing workflows

---

## [1.0.2] - 2024-09-29

### 🔧 **Bug Fixes**
- Fixed ESLint compliance issues for npm publication
- Updated credentials displayName format
- Replaced generic Error with ApplicationError for better n8n integration

---

## [1.0.1] - 2024-09-28

### 🎯 **Initial Release**
- Neo4j vector search integration
- Graph database operations
- AI Tool support for n8n AI Agents
- Docker test environment setup

---

## 🎯 **Migration Guide v1.0.x → v1.1.0**

### **No Action Required**
All existing workflows will continue to work without changes. New operations are additive enhancements.

### **New Capabilities Available**
1. **Document Processing**: Use "Process Document" operation for AI-powered content analysis
2. **Hybrid Search**: Use "Hybrid Search" for intelligent vector+graph queries
3. **Data Management**: Use "Clean by Metadata" and "Update Document" for lifecycle management

### **AI Agent Enhancements**
- New tool operations available for AI Agents
- Enhanced context understanding for search strategy selection
- Improved document processing capabilities

---

**🚀 Ready to revolutionize your Neo4j workflows with AI-powered document processing!**