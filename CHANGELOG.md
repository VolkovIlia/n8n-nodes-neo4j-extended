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

### 🐛 **Includes Hotfix from v1.0.3**
- **Fixed AI Agent Integration Error**: Resolved "supplyData can only be used in retrieve-as-tool mode" error
- Improved mode detection logic and enhanced error handling

---

## [1.0.3] - 2024-09-29 - HOTFIX

### 🐛 **CRITICAL BUG FIX**
- **Fixed AI Agent Integration Error**: Resolved "supplyData can only be used in retrieve-as-tool mode" error
  - Improved mode detection logic in `supplyData` method
  - Added fallback handling for AI Agent tool invocation
  - Enhanced error handling with graceful degradation instead of hard failure
  - Now correctly handles AI Agent connections without requiring manual mode configuration

### 🔧 **Technical Details**
- Modified `supplyData` method to handle mode parameter access failures
- Added warning logging instead of throwing errors for mode mismatches
- Improved AI tool integration robustness for various connection scenarios

---

## [1.0.2] - 2024-09-28

### 🚀 **Initial Release**
- Neo4j graph database integration
- Vector search capabilities with LangChain Neo4j VectorStore
- Basic CRUD operations (Create, Read, Update, Delete)
- Cypher query execution
- AI Agent tool integration via `supplyData` method

### 📦 **Core Features**
- **Graph Operations**: Create nodes, relationships, and execute custom Cypher queries
- **Vector Operations**: Similarity search, document storage with embeddings
- **AI Tool Mode**: Integration as a tool for AI agents with dynamic tool creation
- **Authentication**: Secure Neo4j database connection with credentials

### 🛠 **Technical Stack**
- n8n community node package
- LangChain Neo4j integration
- TypeScript implementation
- Supports Neo4j 4.x and 5.x

---

## [1.0.1] - 2024-09-28

### 🐛 **Bug Fixes**
- Minor fixes and improvements
- Enhanced error handling

---

## [1.0.0] - 2024-09-28

### 🎉 **Initial Public Release**
- First stable release of n8n-nodes-neo4j-extended
- Core Neo4j functionality
- Vector search integration