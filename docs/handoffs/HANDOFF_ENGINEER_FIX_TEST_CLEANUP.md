# Handoff: Fix Test Cleanup for Dynamic Index Names

**FROM**: Anchor Agent (Orchestrator)  
**TO**: Agentic Engineer  
**DATE**: 2025-10-02  
**PRIORITY**: LOW (Test infrastructure, not production code)

---

## 🎯 Task

Fix cleanup function in `scripts/test-vector-index-isolated.js` to properly handle dynamic index names (with timestamps).

---

## 📊 Context

### Current Test Results
- ✅ 7/8 scenarios pass
- ❌ 1 scenario fails: **Scenario 2 (Dimension Mismatch Resolution)**

### Error
```
There already exists an index (:TestChunk2 {embedding2}).
```

### Root Cause
1. Scenario 2 uses dynamic index names: `test_mismatch_${timestamp}`
2. Cleanup function uses hardcoded patterns: `test_`, `manual_`, `delete_`, `info_`
3. Dynamic names like `test_mismatch_1759352460418` are not matched by pattern `test_mismatch`
4. Index artifacts remain between test runs
5. Next run fails because `(:TestChunk2 {embedding2})` already has an index

---

## 🔧 Required Fix

### File to Modify
`scripts/test-vector-index-isolated.js`

### Function to Fix
```javascript
async function cleanupTestIndexes(driver) {
	console.log('\n🧹 Cleaning up test indexes...');
	const testIndexPrefixes = ['test_', 'manual_', 'delete_', 'info_'];
	
	// Current implementation only checks prefixes
	// Misses: test_mismatch_1759352460418, test_mismatch_1759352460418_2048
}
```

### Solution Options

#### Option A: Use LIKE pattern in Cypher (Recommended)
```javascript
async function cleanupTestIndexes(driver) {
	console.log('\n🧹 Cleaning up test indexes...');
	
	try {
		// Get all vector indexes with test patterns
		const patterns = ['test_%', 'manual_%', 'delete_%', 'info_%'];
		
		for (const pattern of patterns) {
			const listResult = await driver.executeQuery(
				'SHOW VECTOR INDEXES YIELD name WHERE name STARTS WITH $prefix RETURN name',
				{ prefix: pattern.replace('%', '') },
				{ database: TEST_CONFIG.database }
			);

			for (const record of listResult.records) {
				const indexName = record.get('name');
				await driver.executeQuery(
					`DROP INDEX \`${indexName}\` IF EXISTS`,
					{},
					{ database: TEST_CONFIG.database }
				);
				console.log(`  Dropped: ${indexName}`);
			}
		}

		// Delete test nodes (all variants)
		const testLabels = [
			'TestChunk', 'TestChunk1', 'TestChunk2', 'TestChunk3', 
			'TestChunk5', 'TestChunk7', 'TestChunk8',
			'TestList1', 'TestList2', 'TestList3', 'Document'
		];
		
		for (const label of testLabels) {
			await driver.executeQuery(
				`MATCH (n:${label}) DETACH DELETE n`,
				{},
				{ database: TEST_CONFIG.database }
			);
		}
		console.log('  Deleted test nodes');
		
	} catch (error) {
		console.warn('Cleanup warning:', error.message);
	}
}
```

#### Option B: Remove timestamp from index names
Change Scenario 2 to use fixed names and ensure proper cleanup between scenarios:
```javascript
// In testScenario2:
const baseIndex = 'test_mismatch_base';
const suffixedIndex = 'test_mismatch_suffixed';

// Add cleanup at start of scenario
await driver.executeQuery(`DROP INDEX \`${baseIndex}\` IF EXISTS`);
await driver.executeQuery(`DROP INDEX \`${suffixedIndex}\` IF EXISTS`);
```

---

## ✅ Acceptance Criteria

1. **AC-1**: All 8 scenarios pass on first run
2. **AC-2**: All 8 scenarios pass on subsequent runs (no artifacts)
3. **AC-3**: Cleanup removes ALL test indexes including dynamic names
4. **AC-4**: Cleanup removes ALL test nodes from all test labels
5. **AC-5**: Test execution time remains < 60 seconds

---

## 🧪 Validation Steps

After fix:
1. Run tests fresh: `node scripts/test-vector-index-isolated.js`
2. Verify: 8/8 PASS
3. Run tests again immediately (without manual cleanup)
4. Verify: 8/8 PASS (no artifact errors)
5. Check Neo4j Browser: No test indexes or nodes remain

---

## 📝 Implementation Plan

1. **Modify `cleanupTestIndexes()` function**:
   - Use `SHOW VECTOR INDEXES` to list all indexes
   - Filter by prefix patterns (test_, manual_, etc.)
   - Drop all matched indexes
   - Delete nodes from all test labels

2. **Add pre-scenario cleanup for Scenario 2**:
   - Drop base index before creating
   - Drop suffixed index before creating
   - Ensures clean state

3. **Test thoroughly**:
   - Run 3 times consecutively
   - Verify no errors on runs 2 and 3

---

## 🚫 Out of Scope

- ❌ Changes to production code (`nodes/Neo4j/Neo4j.node.ts`)
- ❌ Changes to helper functions (`neo4jVectorIndexHelpers.ts`)
- ❌ Feature modifications

This is **test infrastructure only** - production code is working correctly.

---

## ⏭️ After Fix

1. **Agentic Engineer** implements fix
2. **Agentic Engineer** validates: 8/8 tests pass (3 consecutive runs)
3. **Anchor** routes to **Agentic QA** for integration testing
4. **Anchor** coordinates final review and release workflow

---

**Agentic Engineer**: Please implement Option A (LIKE pattern cleanup) as it's more robust for handling any dynamic names. Report back when 8/8 tests pass consistently.
