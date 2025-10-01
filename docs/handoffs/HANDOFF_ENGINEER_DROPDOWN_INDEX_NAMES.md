# 🎯 Handoff: Dynamic Index Name Dropdown for Vector Store Operations

**From**: Anchor (Orchestrator)  
**To**: Agentic Engineer  
**Date**: 2025-10-02  
**Priority**: HIGH  
**Status**: READY FOR IMPLEMENTATION

---

## 📋 User Request (Russian)

> "В ноде Add texts to vector store и Add documents to vector store необходимо создать функционал выбора названий уже созданных векторных индексов из выпадающего списка."

**Translation**: In "Add texts to vector store" and "Add documents to vector store" operations, add functionality to select existing vector index names from a dropdown list.

---

## 🎯 Mission

Transform the `indexName` parameter from a plain text input to a **dynamic dropdown** that loads existing vector indexes from Neo4j, improving UX by:

1. **Preventing typos** - Users select from existing indexes
2. **Discovery** - Users can see what indexes are available
3. **Consistency** - Ensures correct index names are used

---

## 🔍 Current Implementation Analysis

### Current Behavior (Lines 400-414)
```typescript
{
    displayName: 'Index Name',
    name: 'indexName',
    type: 'string',  // ← Currently a plain text input
    displayOptions: {
        show: {
            resource: ['vectorStore'],
        },
    },
    default: 'vector_index',
    description: 'The vector index name to use',
},
```

**Problem**: Users must manually type index names, leading to potential errors.

---

## ✅ Acceptance Criteria

### AC-1: Dynamic Options Method
**Given** the user opens the n8n workflow editor  
**When** they select "Add texts to vector store" or "Add documents to vector store"  
**Then** the "Index Name" field should display a dropdown with existing vector indexes

**Checklist**:
- [ ] Add `methods` property to Neo4j class
- [ ] Implement `loadOptions` function for `indexName`
- [ ] Query Neo4j for existing vector indexes using `listVectorIndexes()` helper
- [ ] Return array of `{ name, value }` objects for dropdown

---

### AC-2: Parameter Type Change
**Given** the implementation is complete  
**When** n8n loads the node properties  
**Then** the `indexName` parameter should have type `options` with `loadOptionsMethod`

**Checklist**:
- [ ] Change `type: 'string'` → `type: 'options'`
- [ ] Add `typeOptions: { loadOptionsMethod: 'getVectorIndexes' }`
- [ ] Keep `default: 'vector_index'` for backward compatibility
- [ ] Update description to mention dynamic loading

---

### AC-3: Manual Input Fallback
**Given** the user wants to use a custom or new index name  
**When** they cannot find their index in the dropdown  
**Then** they should be able to manually type a custom name

**Checklist**:
- [ ] Add `typeOptions.loadOptionsDependsOn: ['credentials']` to refresh on credential change
- [ ] Consider adding "Manual Input" option or allowing free-form input
- [ ] Test with empty Neo4j (0 indexes)

---

### AC-4: Error Handling
**Given** Neo4j connection fails or credentials are invalid  
**When** n8n tries to load the dropdown options  
**Then** it should show a clear error message or empty list

**Checklist**:
- [ ] Wrap `listVectorIndexes()` call in try-catch
- [ ] Return empty array `[]` on connection errors
- [ ] Log errors for debugging
- [ ] Test with invalid credentials

---

## 🛠️ Implementation Guide

### Step 1: Add `methods` Property to Neo4j Class

Location: `nodes/Neo4j/Neo4j.node.ts` (after class properties, before `supplyData`)

```typescript
export class Neo4j implements INodeType {
    description: INodeTypeDescription;

    // Add this new property
    methods = {
        loadOptions: {
            async getVectorIndexes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                // Get credentials
                const credentials = await this.getCredentials('neo4jApi');
                
                // Initialize Neo4j driver
                const neo4j = require('neo4j-driver');
                const driver = neo4j.driver(
                    credentials.url as string,
                    neo4j.auth.basic(
                        credentials.username as string,
                        credentials.password as string
                    )
                );

                try {
                    // Get database parameter (optional)
                    const database = this.getCurrentNodeParameter('database', undefined) as string | undefined;

                    // Use existing helper to list indexes
                    const indexes = await listVectorIndexes(driver, database);

                    // Convert to dropdown format
                    return indexes.map(index => ({
                        name: `${index.name} (${index.dimension}D, ${index.nodeLabel}.${index.property})`,
                        value: index.name,
                    }));
                } catch (error) {
                    // Log error and return empty array
                    console.error('Failed to load vector indexes:', error);
                    return [];
                } finally {
                    await driver.close();
                }
            },
        },
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        // ... existing code
    }
}
```

**Key Points**:
- Uses existing `listVectorIndexes()` helper (already implemented)
- Formats dropdown as: `index_name (1536D, Chunk.embedding)`
- Returns empty array on errors (graceful degradation)
- Properly closes driver connection

---

### Step 2: Update `indexName` Parameter Definition

Location: `nodes/Neo4j/Neo4j.node.ts` (lines ~400-414)

**Before**:
```typescript
{
    displayName: 'Index Name',
    name: 'indexName',
    type: 'string',
    displayOptions: {
        show: {
            resource: ['vectorStore'],
        },
    },
    default: 'vector_index',
    description: 'The vector index name to use',
},
```

**After**:
```typescript
{
    displayName: 'Index Name',
    name: 'indexName',
    type: 'options',  // ← Changed from 'string'
    typeOptions: {
        loadOptionsMethod: 'getVectorIndexes',  // ← Added
        loadOptionsDependsOn: ['credentials'],  // ← Refresh when credentials change
    },
    displayOptions: {
        show: {
            resource: ['vectorStore'],
        },
    },
    default: 'vector_index',
    description: 'Select an existing vector index or type a custom name. Indexes are loaded from Neo4j.',  // ← Updated
},
```

---

### Step 3: Test Implementation

**Manual Testing in n8n GUI**:
1. Open n8n at `http://localhost:5679`
2. Add Neo4j node to workflow
3. Configure credentials (bolt://localhost:7688, neo4j/testpassword123)
4. Select resource: "Vector Store"
5. Select operation: "Insert Documents" or "Insert Texts"
6. Click "Index Name" dropdown
7. **Verify**: List of existing indexes appears
8. **Verify**: Format shows dimension and label info

**Edge Cases to Test**:
- [ ] Empty Neo4j (0 indexes) → Shows empty dropdown or "No indexes found"
- [ ] Invalid credentials → Empty dropdown, no crash
- [ ] After creating new index → Refresh shows new index
- [ ] Multiple indexes → All appear in dropdown

---

## 📁 Files to Modify

### Primary File
- **File**: `nodes/Neo4j/Neo4j.node.ts`
- **Lines**: 
  - ~155-160: Add `methods` property to class
  - ~400-414: Update `indexName` parameter definition
- **Estimated Changes**: ~50 lines added

### Dependencies (Already Implemented)
- ✅ `nodes/Neo4j/neo4jVectorIndexHelpers.ts` (helper functions)
- ✅ `listVectorIndexes()` function (already tested, 8/8 integration tests pass)

---

## 🔧 Technical Specifications

### n8n API Requirements
```typescript
// Import type for loadOptions
import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

// Method signature
methods = {
    loadOptions: {
        async getVectorIndexes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
            // Implementation
        },
    },
};
```

### Return Format
```typescript
[
    { name: 'vector_index (1536D, Chunk.embedding)', value: 'vector_index' },
    { name: 'gigachat_index (2048D, Document.vector)', value: 'gigachat_index' },
    { name: 'openai_index (1536D, Text.embedding)', value: 'openai_index' },
]
```

---

## 🚨 Edge Cases & Error Handling

### Case 1: Connection Failure
```typescript
try {
    const indexes = await listVectorIndexes(driver, database);
    return indexes.map(/* ... */);
} catch (error) {
    console.error('Failed to load vector indexes:', error);
    return [];  // Return empty array, don't crash
}
```

### Case 2: No Indexes Found
```typescript
const indexes = await listVectorIndexes(driver, database);
if (indexes.length === 0) {
    return [
        { name: 'No indexes found - type custom name', value: '' }
    ];
}
```

### Case 3: Custom Name Input
- Keep parameter as `options` type
- n8n allows typing custom values in `options` fields by default
- If user types new name, auto-create logic will create it (already implemented)

---

## 📊 Testing Checklist

### Unit Testing (Optional)
- [ ] Mock `getCredentials()` to return test credentials
- [ ] Mock `listVectorIndexes()` to return test data
- [ ] Verify dropdown format matches expectations

### Integration Testing (Required)
1. **Test 1: Normal Operation**
   - [ ] Open n8n GUI
   - [ ] Configure credentials
   - [ ] Select "Insert Documents"
   - [ ] Verify dropdown shows existing indexes
   
2. **Test 2: Empty Database**
   - [ ] Clean all indexes from Neo4j
   - [ ] Verify dropdown shows "No indexes found" or empty
   
3. **Test 3: Custom Name**
   - [ ] Type custom index name (not in list)
   - [ ] Execute workflow
   - [ ] Verify auto-create creates new index
   
4. **Test 4: Invalid Credentials**
   - [ ] Configure wrong password
   - [ ] Verify dropdown doesn't crash
   - [ ] Check console for error logs

---

## 🎯 Success Criteria

**Implementation is COMPLETE when**:
- ✅ `methods.loadOptions.getVectorIndexes` implemented
- ✅ `indexName` parameter changed to `type: 'options'`
- ✅ Dropdown loads existing indexes from Neo4j
- ✅ Format shows: `name (dimensionD, label.property)`
- ✅ Error handling prevents crashes
- ✅ Manual testing in n8n GUI passes all 4 test cases
- ✅ No regression in existing functionality (auto-create still works)

**Definition of Done**:
- [ ] Code compiles without errors
- [ ] Manual testing in n8n GUI successful
- [ ] No crashes with invalid credentials
- [ ] Existing integration tests still pass (8/8)
- [ ] Documentation updated (if needed)

---

## 📚 Reference Documentation

### n8n API Documentation
- **ILoadOptionsFunctions**: Used to load dynamic dropdown options
- **INodePropertyOptions**: Return type for dropdown items
- **typeOptions.loadOptionsMethod**: Links parameter to method name

### Example from n8n Core Nodes
```typescript
// Example from PostgreSQL node
methods = {
    loadOptions: {
        async getTables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
            const credentials = await this.getCredentials('postgres');
            const client = await pool.connect();
            const result = await client.query('SELECT tablename FROM pg_tables');
            return result.rows.map(row => ({
                name: row.tablename,
                value: row.tablename,
            }));
        },
    },
};
```

---

## 🔄 Next Steps After Implementation

1. **Test in n8n GUI** (Agentic Engineer)
   - Verify dropdown loads correctly
   - Test all 4 edge cases
   - Screenshot results for documentation

2. **Create Test Report** (Agentic QA)
   - Document GUI testing results
   - Verify no regressions
   - Approve for merge

3. **Update Documentation** (Docs Writer)
   - Add dropdown feature to README
   - Update CHANGELOG for v1.1.0
   - Add screenshots of dropdown in action

4. **Merge & Release** (DevOps)
   - Merge to master branch
   - Version bump: 1.0.4 → 1.1.0
   - npm publish

---

## 📎 Context Files

- **Implementation File**: `nodes/Neo4j/Neo4j.node.ts`
- **Helper Functions**: `nodes/Neo4j/neo4jVectorIndexHelpers.ts`
- **Test Environment**: Docker (n8n: 5679, Neo4j: 7688)
- **Integration Tests**: `scripts/test-integration-workflows.js` (8/8 PASS)

---

## 💬 Communication Protocol

- Report progress in Russian to user
- Use role annotation: **👨‍💻 Agentic Engineer**
- Include before/after code snippets
- Screenshot dropdown in n8n GUI when complete
- Ask for clarification if n8n API behavior unclear

---

**Ready to implement!** 🚀

Please implement the dropdown functionality and test in n8n GUI at `http://localhost:5679`.
