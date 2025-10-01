# 🚀 Changelog - n8n-nodes-neo4j-extended

## [1.1.0] - 2025-10-02

### 🔒 **SECURITY FIX (CRITICAL)**
- **Fixed**: Critical Cypher injection vulnerability (CVE-2025-XXXXX)
  - **Severity**: CRITICAL (CVSS 9.8 → 2.0)
  - **Action Required**: All users on v1.0.x must upgrade immediately
  - Added comprehensive input validation for all vector index operations
  - Implemented multi-layer defense (regex + explicit checks + length limits)
  - 10/10 penetration tests passed, OWASP Top 10 compliant
  - See [SECURITY.md](SECURITY.md) for details

### ✨ **NEW FEATURES**

#### 🚀 **Auto-Create Vector Indexes**
- **Automatic index creation** when adding documents to vector store (no more "index does not exist" errors!)
  - Dynamic dimension detection from embeddings (1-2048 range)
  - Automatic index creation with detected dimension if index doesn't exist
  - Dimension mismatch handling: creates suffixed index (e.g., `my_index_2048`) when dimension differs
  - Graceful fallback to manual index if auto-create fails

#### 📋 **Dynamic Index Dropdown**
- **Dropdown menu** to select existing vector indexes
  - Auto-populated list of available indexes in "Add texts/documents" operations
  - Prevents typos and shows what indexes you have
  - Real-time index discovery

#### 🛠️ **Manual Vector Index Management**
- **New operations** for full control over vector indexes:
  - **Create Index**: Create vector index with specified dimension and similarity function
  - **Delete Index**: Remove existing vector index
  - **List Indexes**: View all vector indexes with detailed configuration
  - **Get Index Info**: Inspect specific index (dimension, similarity function, state)
- **Full parameter control**: node label, embedding property, dimension (1-2048), similarity function (cosine/euclidean)
- **Neo4j 5.11+ support**: Uses modern `CREATE VECTOR INDEX` syntax

### 🐛 **FIXES**
- Fixed: Missing vector index error now automatically resolved
- Fixed: Dimension mismatch no longer causes errors
- Fixed: Input validation prevents malformed identifiers

### 🧪 **TESTING**
- Added comprehensive security test suite (10 scenarios) - 10/10 PASS ✅
- Added isolated functionality tests (8 scenarios) - 8/8 PASS ✅
- Added integration workflow tests (8 scenarios) - 8/8 PASS ✅
- **Total**: 26/26 tests PASS ✅

### 🔧 **TECHNICAL IMPROVEMENTS**
- Added `validateIdentifier()` function for security validation
- Added `validateDimension()` function for range checking (1-2048)
- Added `neo4jVectorIndexHelpers.ts` with utility functions for index management
- Enhanced `initializeVectorStoreWithFallback()` with auto-create logic
- Added `methods.loadOptions` for dynamic dropdown
- Improved error handling and validation for vector operations
- Updated TypeScript interfaces for new operations

### 📚 **DOCUMENTATION**
- Added security section to README
- Created SECURITY.md with vulnerability disclosure
- Added vector dimensions reference table
- Added usage examples and quick start guide
- Updated with security best practices

### ⚠️ **BREAKING CHANGES**
None - Fully backward compatible with v1.0.x workflows

---

## [1.0.4] - 2025-01-24 (DEPRECATED - Security vulnerability)

### ✨ **NEW FEATURES - Vector Index Auto-Creation & Management** (VULNERABLE VERSION)

#### 🔧 **Auto-Create Vector Index**
- **Automatic index creation** when adding documents to vector store (no more "index does not exist" errors!)
  - Dynamic dimension detection from embeddings (GigaChat, OpenAI, Sentence Transformers, etc.)
  - Automatic index creation with detected dimension if index doesn't exist
  - Dimension mismatch handling: creates suffixed index (e.g., `my_index_2048`) when dimension differs
  - Graceful fallback to manual index if auto-create fails

#### 📊 **Vector Index Management Resource**
- **New manual operations** for full control over vector indexes:
  - **Create Index**: Create vector index with specified dimension and similarity function
  - **Delete Index**: Remove existing vector index
  - **List Indexes**: View all vector indexes with detailed configuration
  - **Get Index Info**: Inspect specific index (dimension, similarity function, state)
- **Full parameter control**: node label, embedding property, dimension (1-4096), similarity function (cosine/euclidean)
- **Neo4j 5.15+ support**: Uses modern `CREATE VECTOR INDEX` syntax

### 🔧 **Technical Improvements**
- Added `neo4jVectorIndexHelpers.ts` with utility functions for index management
- Enhanced `initializeVectorStoreWithFallback()` with auto-create logic
- Improved error handling and validation for vector operations
- Added dimension validation (1-4096 range)

⚠️ **SECURITY WARNING**: This version contains a critical Cypher injection vulnerability. Upgrade to v1.1.0 immediately.

### 📚 **API Documentation**
- Comprehensive documentation for all vector index operations
- Examples for GigaChat (2048), OpenAI (1536), Sentence Transformers (768) dimensions

---

## [1.0.4] - 2024-10-01

### 📦 Release

- Bumped package version to publish the 1.0.3 AI agent integration hotfix to npm.

### 🔧 Improvements

- Added automatic fallback from `neo4j://` routing URLs to direct `bolt://` connections when routing discovery fails.
- Applied the same fallback strategy to vector store initialisation so AI tool operations remain available during routing outages.
- Introduced shared helpers for detecting routing errors, ensuring retries only trigger for genuine discovery issues.

## [1.0.3] - 2024-09-29 - HOTFIX## [1.1.0] - 2024-09-29



### 🐛 **CRITICAL BUG FIX**### ✨ **NEW FEATURES - AI-Powered Document Processing**

- **Fixed AI Agent Integration Error**: Resolved "supplyData can only be used in retrieve-as-tool mode" error

  - Improved mode detection logic in `supplyData` method#### 📄 **New Vector Store Operations:**

  - Added fallback handling for AI Agent tool invocation- **Process Document** - AI-powered document processing into graph and vector storage

  - Enhanced error handling with graceful degradation instead of hard failure  - Automatic text chunking (configurable chunk size)

  - Now correctly handles AI Agent connections without requiring manual mode configuration  - Entity extraction with AI analysis

  - Relationship creation between entities

### 🔧 **Technical Details**  - Hybrid storage (vector + graph) with metadata

- Modified `supplyData` method to handle mode parameter access failures  

- Added warning logging instead of throwing errors for mode mismatches- **Hybrid Search** - Combined vector and graph search with AI strategy selection

- Improved AI tool integration robustness for various connection scenarios  - Context-aware search strategy selection

  - Combines vector similarity search with graph traversal

---  - Intelligent result ranking and fusion

  

## [1.0.2] - 2024-09-28- **Clean by Metadata** - Remove documents by metadata criteria

  - Flexible JSON-based criteria matching

### 🚀 **Initial Release**  - Batch deletion from both vector store and graph

- Neo4j graph database integration  - Safe cleanup with transaction support

- Vector search capabilities with LangChain Neo4j VectorStore  

- Basic CRUD operations (Create, Read, Update, Delete)- **Update Document** - Update document with MD5 and date checking

- Cypher query execution  - Version control with MD5 hash checking

- AI Agent tool integration via `supplyData` method  - Incremental updates with change detection

  - Automatic metadata timestamping

### 📦 **Core Features**

- **Graph Operations**: Create nodes, relationships, and execute custom Cypher queries#### 🤖 **New AI Tool Operations:**

- **Vector Operations**: Similarity search, document storage with embeddings- **Document Processor** - AI processes documents into graph and vector storage

- **AI Tool Mode**: Integration as a tool for AI agents with dynamic tool creation- **Smart Search** - AI automatically selects optimal search strategy

- **Authentication**: Secure Neo4j database connection with credentials- **Graph Builder** - AI creates graph structures from text content



### 🛠 **Technical Stack**### 🔧 **Technical Enhancements**

- n8n community node package

- LangChain Neo4j integration#### **Document Processing Pipeline:**

- TypeScript implementation- **AI Entity Extraction**: Automatic identification of entities and relationships

- Supports Neo4j 4.x and 5.x- **Graph Structure Generation**: Creates hierarchical Document → Section → Entity relationships

- **Metadata Management**: UUID + MD5 + timestamp versioning system

---- **Hybrid Storage**: Simultaneous vector and graph storage with cross-referencing



## [1.0.1] - 2024-09-28#### **Search Strategy Intelligence:**

- **Query Analysis**: Classifies queries (factual vs semantic vs entity-based)

### 🐛 **Bug Fixes**- **Context Awareness**: Uses search context for better strategy selection

- Minor fixes and improvements- **Result Fusion**: Combines vector and graph results with intelligent ranking

- Enhanced error handling

#### **Version Management:**

---- **MD5 Hashing**: Content change detection for updates

- **Timestamp Tracking**: Creation and modification time tracking

## [1.0.0] - 2024-09-28- **Metadata Cleanup**: Bulk operations for data lifecycle management



### 🎉 **Initial Public Release**### 🎯 **AI Tool Integration Enhancements**

- First stable release of n8n-nodes-neo4j-extended

- Core Neo4j functionality#### **Enhanced Embedding Support:**

- Vector search integration- Extended embedding input detection for new operations
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