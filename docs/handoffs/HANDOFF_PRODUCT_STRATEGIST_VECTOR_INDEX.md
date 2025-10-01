# Product Strategist Handoff: Vector Index Management Feature

## 📋 Business Requirements (Confirmed)

### User Decisions
1. **Approach**: ✅ **Both approaches** (auto-create + manual operations)
2. **Dimension conflict resolution**: ✅ **Option C** - Create new index with suffix (my_index_768)
3. **Dimensionality detection**: ✅ **Dynamic** - detect from connected embeddings model (not hardcoded to GigaChat)

### Problem Statement
**Current Issue**: Users receive error "The specified vector index name does not exist" when adding documents to vector store, requiring manual Neo4j Cypher commands to create indexes before using the plugin.

**User Pain Points**:
- Interrupts workflow (must switch to Neo4j Browser/Cypher Shell)
- Requires Neo4j expertise (CREATE VECTOR INDEX syntax)
- Error-prone (wrong dimension, wrong similarity function)
- No visibility into existing indexes from n8n GUI

### Target Persona
**n8n + Neo4j + AI/LangChain user** who:
- Builds RAG (Retrieval-Augmented Generation) workflows
- Uses various embedding models (GigaChat, OpenAI, Cohere, local models)
- May not be Neo4j expert
- Wants seamless experience like Qdrant/Pinecone plugins

### Success Metrics
- ✅ Zero manual Cypher commands required for basic vector operations
- ✅ Support for multiple embedding dimensions in same database
- ✅ Clear GUI for advanced users who want manual control
- ✅ Graceful handling of dimension mismatches
- ✅ Backward compatible with v1.0.4 workflows

---

## 📝 User Stories

### US-1: Auto-Create Vector Index on First Document Add
**As a** n8n workflow builder  
**I want** the plugin to automatically create vector indexes when adding documents  
**So that** I don't need to manually run Cypher commands before using vector operations

**Priority**: 🔴 **CRITICAL** - Core feature, blocks current users

**Acceptance Criteria**:
- **AC-1.1**: GIVEN no vector index exists AND user adds documents WHEN operation executes THEN plugin detects missing index and creates it automatically
- **AC-1.2**: GIVEN embeddings model connected WHEN plugin creates index THEN dimension is detected from embeddings.embedDocuments() output length
- **AC-1.3**: GIVEN index created successfully WHEN document add proceeds THEN documents are inserted with embeddings
- **AC-1.4**: GIVEN index creation fails WHEN error occurs THEN clear error message explains what went wrong and how to fix manually

**Technical Notes**:
- Use Neo4j driver to execute: `CREATE VECTOR INDEX indexName FOR (n:NodeLabel) ON (n.propertyName) OPTIONS {indexConfig: {vector.dimensions: $dim, vector.similarity_function: 'cosine'}}`
- Detect dimension: `const testEmbedding = await embeddings.embedDocuments(['test']); const dimension = testEmbedding[0].length;`
- Default similarity: `cosine` (most common for RAG)

---

### US-2: Handle Dimension Mismatch with Auto-Suffix
**As a** n8n workflow builder  
**I want** the plugin to handle dimension mismatches gracefully  
**So that** I can use different embedding models with the same base index name

**Priority**: 🟠 **HIGH** - Prevents data loss, enables multi-model workflows

**Acceptance Criteria**:
- **AC-2.1**: GIVEN index "my_index" exists with dimension=384 AND user adds documents with dimension=768 WHEN operation executes THEN plugin creates new index "my_index_768" automatically
- **AC-2.2**: GIVEN dimension mismatch detected WHEN new index created THEN user receives INFO message: "Created new index 'my_index_768' (existing 'my_index' has different dimension 384)"
- **AC-2.3**: GIVEN multiple indexes with same base name WHEN user queries THEN plugin uses index matching current embeddings dimension
- **AC-2.4**: GIVEN suffix pattern used WHEN displaying to user THEN format is `{baseName}_{dimension}` (e.g., "embeddings_1536")

**Technical Notes**:
- Query existing index: `SHOW VECTOR INDEXES YIELD name, labelsOrTypes, properties, options WHERE name = $indexName`
- Extract dimension from options: `options.indexConfig['vector.dimensions']`
- Suffix logic: if dimension mismatch, append `_${detectedDimension}` to base name

---

### US-3: Manual Vector Index Operations
**As a** Neo4j power user  
**I want** GUI operations to create/delete/list vector indexes  
**So that** I have full control over index management without leaving n8n

**Priority**: 🟡 **MEDIUM** - Nice-to-have for advanced users

**Acceptance Criteria**:
- **AC-3.1**: GIVEN "Vector Index Management" resource selected WHEN user chooses "Create Index" operation THEN GUI shows: indexName, nodeLabel, propertyName, dimension, similarityFunction
- **AC-3.2**: GIVEN valid parameters entered WHEN user executes "Create Index" THEN index created and success message returned
- **AC-3.3**: GIVEN index name provided WHEN user executes "Delete Index" THEN index dropped and confirmation message returned
- **AC-3.4**: GIVEN "List Indexes" operation selected WHEN user executes THEN returns all vector indexes with: name, nodeLabel, propertyName, dimension, similarityFunction, state
- **AC-3.5**: GIVEN index name provided WHEN user executes "Get Index Info" THEN returns detailed info: dimension, similarity, node count, status

**Technical Notes**:
- List: `SHOW VECTOR INDEXES`
- Create: `CREATE VECTOR INDEX $name FOR (n:$label) ON (n.$prop) OPTIONS {...}`
- Delete: `DROP INDEX $name IF EXISTS`
- Get Info: `SHOW VECTOR INDEXES YIELD * WHERE name = $name`

---

## 🏗️ Implementation Strategy

### Approach 1: Auto-Create (Transparent UX)
**Flow**:
```
addDocuments operation
  ↓
Check if index exists (SHOW VECTOR INDEXES)
  ↓
If missing → Detect dimension → Create index
  ↓
If exists → Check dimension match
  ↓
If mismatch → Create index_{dimension}
  ↓
Proceed with document insertion
```

**Benefits**:
- Zero configuration for 90% of users
- Qdrant-like experience
- Handles multi-model scenarios

**Risks**:
- Unexpected index proliferation if users frequently change models
- Auto-creation might mask configuration issues

**Mitigation**:
- Log INFO messages when creating new indexes
- Add option to disable auto-create (default: enabled)

---

### Approach 2: Manual Operations (Power User Control)
**New Resource**: `vectorIndexManagement`

**Operations**:
- `createIndex` - Full control over all parameters
- `deleteIndex` - Remove unused indexes
- `listIndexes` - Audit existing indexes
- `getIndexInfo` - Detailed inspection

**Benefits**:
- Explicit control for advanced users
- Enables maintenance workflows (cleanup old indexes)
- Debugging tool (check what indexes exist)

**Risks**:
- More steps for simple use cases

**Mitigation**:
- Default to auto-create for simplicity
- Manual operations optional for advanced users

---

## 🚫 Non-Functional Requirements

### Performance
- Index detection query must complete in <500ms
- Dimension detection should use single test embedding (not batch)
- Cache index metadata to avoid repeated SHOW INDEXES queries

### Backward Compatibility
- Existing v1.0.4 workflows must continue working
- If user pre-created index manually, plugin detects and uses it
- No breaking changes to existing parameters

### Error Handling
- Clear error messages with actionable guidance
- Distinguish between: missing permissions, syntax errors, connection issues
- Provide fallback instructions for manual index creation

### Security & Compliance
- Validate user inputs to prevent Cypher injection
- Use parameterized queries for all index operations
- Check user permissions before index operations (may fail on read-only users)

---

## 📦 Context Package for Downstream Agents

### For Researcher
**Questions to investigate**:
1. Neo4j Vector Index Cypher syntax (CREATE/DROP/SHOW commands)
2. LangChain `@langchain/community` support for index management
3. Embedding dimension detection patterns in other n8n plugins
4. Neo4j driver API for index operations (driver.executeQuery vs session.run)

**Required outputs**:
- Code examples for each index operation
- Dimension detection best practices
- Error handling patterns

---

### For Database Specialist
**Scope**:
1. Define Neo4j vector index schema and parameters
2. Design dimension detection algorithm
3. Specify similarity function options (cosine, euclidean, dot product)
4. Index naming conventions and suffix pattern

**Required outputs**:
- DDL templates for CREATE VECTOR INDEX
- Index metadata query patterns
- Dimension extraction logic

---

### For AI Solutions Architect
**Design decisions needed**:
1. Where to inject auto-create logic (before addDocuments, in initializeVectorStore?)
2. Caching strategy for index metadata
3. Error recovery flows (retry logic, fallback to manual creation)
4. Configuration options (enable/disable auto-create, custom suffix patterns)

**Required outputs**:
- System architecture diagram
- Data flow diagrams for auto-create and manual operations
- Error handling state machine

---

### For Agentic Engineer
**Implementation tasks**:
1. Add index detection helper functions
2. Implement dimension detection from embeddings model
3. Add auto-create logic to addDocuments operation
4. Create new `vectorIndexManagement` resource with 4 operations
5. Update TypeScript types and interfaces
6. Add configuration options to node properties

**Required outputs**:
- Working code in `nodes/Neo4j/Neo4j.node.ts`
- Helper functions for index operations
- Updated node description properties

---

### For Agentic QA
**Test scenarios**:
1. **Happy path**: No index exists → auto-creates → adds documents ✅
2. **Dimension match**: Index exists with correct dimension → uses existing ✅
3. **Dimension mismatch**: Index exists dimension=384, embeddings=768 → creates my_index_768 ✅
4. **Multiple suffixes**: my_index_384, my_index_768 exist → routes to correct one ✅
5. **Manual operations**: Create, delete, list, get info all work ✅
6. **Error cases**: Invalid parameters, permission denied, connection failure 🔴
7. **Backward compat**: v1.0.4 workflows with pre-created indexes still work ✅

**Required outputs**:
- Test plan with all scenarios
- Automated test scripts (if possible)
- Manual test results with screenshots

---

## 🎯 Definition of Done

### Feature Complete When:
- ✅ Auto-create works for new indexes
- ✅ Dimension mismatch creates suffixed index
- ✅ Manual operations (create/delete/list/info) all functional
- ✅ Dimension detection works with any embeddings model
- ✅ All acceptance criteria validated
- ✅ Documentation updated (README, examples)
- ✅ Changelog entry added
- ✅ Tests pass (manual or automated)
- ✅ User confirmation: "It works as expected"

### Ready for Release:
- ✅ Code reviewed (Reviewer agent)
- ✅ Security validated (no Cypher injection)
- ✅ Performance acceptable (<1s overhead for index checks)
- ✅ npm publish as v1.1.0

---

## 🔄 Next Agent: Researcher

**Handoff to**: `@researcher`

**Task**: Investigate Neo4j Vector Index API and dimension detection patterns

**Deliverable**: `docs/research/RESEARCHER_REPORT_NEO4J_VECTOR_INDEX.md` with:
1. Complete Cypher syntax for all index operations
2. LangChain integration possibilities
3. Dimension detection code examples
4. Error handling patterns from Neo4j driver

**Timeline**: Before proceeding to implementation

---

## ✅ Product Strategist Sign-off

**Prepared by**: Anchor Agent (Product Strategist delegation)  
**Date**: 2025-10-01  
**Status**: ✅ Requirements finalized, ready for technical investigation

**User confirmation**: ✅ Received (both approaches, suffix pattern, dynamic dimension)
