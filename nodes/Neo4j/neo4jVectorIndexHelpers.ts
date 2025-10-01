/**
 * Neo4j Vector Index Helper Functions
 * 
 * Provides utilities for managing Neo4j vector indexes:
 * - Check if index exists
 * - Create vector index
 * - Delete vector index
 * - List all vector indexes
 * - Detect embedding dimension
 */

import type { Driver as Neo4jDriver } from 'neo4j-driver';
import type { Embeddings } from '@langchain/core/embeddings';

// Constants
const MAX_VECTOR_DIMENSION = 2048; // Neo4j 5.11+ supports up to 2048 dimensions

/**
 * Validate Neo4j identifier (label or property name) to prevent Cypher injection
 * 
 * Neo4j identifiers must:
 * - Start with a letter, underscore, or dollar sign
 * - Contain only letters, numbers, underscores, and dollar signs
 * - Not contain backticks or other special characters
 * 
 * @param identifier Label or property name to validate
 * @param paramName Parameter name for error messages
 * @throws Error if identifier contains invalid characters
 */
function validateIdentifier(identifier: string, paramName: string): void {
	// Neo4j identifier rules: must start with letter, underscore, or dollar sign
	// Can contain letters, numbers, underscores, and dollar signs
	const validPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
	
	if (!validPattern.test(identifier)) {
		throw new Error(
			`Invalid ${paramName}: "${identifier}". ` +
			`Must start with a letter, underscore, or dollar sign, ` +
			`and contain only letters, numbers, underscores, and dollar signs.`
		);
	}
	
	// Additional security check: reject if contains backtick
	if (identifier.includes('`')) {
		throw new Error(
			`Invalid ${paramName}: "${identifier}". Backticks are not allowed.`
		);
	}
	
	// Prevent excessively long identifiers (DoS protection)
	if (identifier.length > 255) {
		throw new Error(
			`Invalid ${paramName}: "${identifier}". Must be 255 characters or less.`
		);
	}
}

/**
 * Validate vector dimension
 * @param dimension Vector dimension to validate
 * @throws Error if dimension is invalid
 */
function validateDimension(dimension: number): void {
	if (!Number.isInteger(dimension)) {
		throw new Error(
			`Vector dimension must be an integer, got ${dimension}`
		);
	}
	
	if (dimension < 1 || dimension > MAX_VECTOR_DIMENSION) {
		throw new Error(
			`Vector dimension must be between 1 and ${MAX_VECTOR_DIMENSION}, got ${dimension}`
		);
	}
}

export interface VectorIndexInfo {
	name: string;
	nodeLabel: string;
	property: string;
	dimension: number;
	similarityFunction: 'cosine' | 'euclidean';
	state: string;
}

export interface IndexExistsResult {
	exists: boolean;
	dimension?: number;
	similarityFunction?: string;
}

/**
 * Check if a vector index exists and get its configuration
 * @param driver Neo4j driver instance
 * @param indexName Name of the index to check
 * @param database Database name (optional)
 * @returns Index existence and configuration details
 */
export async function checkIndexExists(
	driver: Neo4jDriver,
	indexName: string,
	database?: string
): Promise<IndexExistsResult> {
	const query = `
		SHOW VECTOR INDEXES
		YIELD name, options
		WHERE name = $indexName
		RETURN 
			name,
			options.indexConfig['vector.dimensions'] AS dimension,
			options.indexConfig['vector.similarity_function'] AS similarityFunction
	`;

	const result = await driver.executeQuery(query, { indexName }, { database });

	if (result.records.length === 0) {
		return { exists: false };
	}

	const record = result.records[0];
	return {
		exists: true,
		dimension: Number(record.get('dimension')),
		similarityFunction: record.get('similarityFunction') as 'cosine' | 'euclidean',
	};
}

/**
 * Create a new vector index using modern Cypher syntax (Neo4j 5.15+)
 * @param driver Neo4j driver instance
 * @param indexName Name for the new index
 * @param nodeLabel Node label to index
 * @param propertyName Property containing embeddings
 * @param dimension Vector dimension
 * @param similarityFunction Similarity function ('cosine' or 'euclidean')
 * @param database Database name (optional)
 */
export async function createVectorIndex(
	driver: Neo4jDriver,
	indexName: string,
	nodeLabel: string,
	propertyName: string,
	dimension: number,
	similarityFunction: 'cosine' | 'euclidean' = 'cosine',
	database?: string
): Promise<void> {
	// Validate inputs to prevent Cypher injection
	validateIdentifier(indexName, 'indexName');
	validateIdentifier(nodeLabel, 'nodeLabel');
	validateIdentifier(propertyName, 'propertyName');
	validateDimension(dimension);

	// Validate similarity function
	if (similarityFunction !== 'cosine' && similarityFunction !== 'euclidean') {
		throw new Error(
			`Invalid similarity function: "${similarityFunction}". Must be 'cosine' or 'euclidean'.`
		);
	}

	// Note: Neo4j CREATE VECTOR INDEX doesn't support parameterized index names
	// But since all identifiers are validated, string interpolation is safe here
	const query = `
		CREATE VECTOR INDEX \`${indexName}\` IF NOT EXISTS
		FOR (n:\`${nodeLabel}\`)
		ON (n.\`${propertyName}\`)
		OPTIONS {
			indexConfig: {
				\`vector.dimensions\`: ${dimension},
				\`vector.similarity_function\`: '${similarityFunction}'
			}
		}
	`;

	await driver.executeQuery(query, {}, { database });
}

/**
 * Delete a vector index
 * @param driver Neo4j driver instance
 * @param indexName Name of the index to delete
 * @param database Database name (optional)
 */
export async function deleteVectorIndex(
	driver: Neo4jDriver,
	indexName: string,
	database?: string
): Promise<void> {
	// Validate input to prevent Cypher injection
	validateIdentifier(indexName, 'indexName');
	
	// Note: DROP INDEX doesn't support parameterized index names
	// But since identifier is validated, string interpolation is safe
	const query = `DROP INDEX \`${indexName}\` IF EXISTS`;
	await driver.executeQuery(query, {}, { database });
}

/**
 * List all vector indexes in the database
 * @param driver Neo4j driver instance
 * @param database Database name (optional)
 * @returns Array of vector index information
 */
export async function listVectorIndexes(
	driver: Neo4jDriver,
	database?: string
): Promise<VectorIndexInfo[]> {
	const query = `
		SHOW VECTOR INDEXES
		YIELD name, state, labelsOrTypes, properties, options
		RETURN 
			name,
			state,
			labelsOrTypes[0] AS nodeLabel,
			properties[0] AS property,
			options.indexConfig['vector.dimensions'] AS dimension,
			options.indexConfig['vector.similarity_function'] AS similarityFunction
	`;

	const result = await driver.executeQuery(query, {}, { database });

	return result.records.map(record => ({
		name: record.get('name'),
		nodeLabel: record.get('nodeLabel'),
		property: record.get('property'),
		dimension: Number(record.get('dimension')),
		similarityFunction: record.get('similarityFunction') as 'cosine' | 'euclidean',
		state: record.get('state'),
	}));
}

/**
 * Detect embedding dimension by generating a test embedding
 * @param embeddings Embeddings instance
 * @returns Detected dimension
 */
export async function detectEmbeddingDimension(embeddings: Embeddings): Promise<number> {
	const testVector = await embeddings.embedDocuments(['test']);
	return testVector[0].length;
}

/**
 * Get detailed information about a specific vector index
 * @param driver Neo4j driver instance
 * @param indexName Name of the index
 * @param database Database name (optional)
 * @returns Detailed index information or null if not found
 */
export async function getIndexInfo(
	driver: Neo4jDriver,
	indexName: string,
	database?: string
): Promise<VectorIndexInfo | null> {
	const query = `
		SHOW VECTOR INDEXES
		YIELD name, state, labelsOrTypes, properties, options
		WHERE name = $indexName
		RETURN 
			name,
			state,
			labelsOrTypes[0] AS nodeLabel,
			properties[0] AS property,
			options.indexConfig['vector.dimensions'] AS dimension,
			options.indexConfig['vector.similarity_function'] AS similarityFunction
	`;

	const result = await driver.executeQuery(query, { indexName }, { database });

	if (result.records.length === 0) {
		return null;
	}

	const record = result.records[0];
	return {
		name: record.get('name'),
		nodeLabel: record.get('nodeLabel'),
		property: record.get('property'),
		dimension: Number(record.get('dimension')),
		similarityFunction: record.get('similarityFunction') as 'cosine' | 'euclidean',
		state: record.get('state'),
	};
}

/**
 * Generate a suffixed index name for dimension mismatch scenarios
 * @param baseName Base index name
 * @param dimension Embedding dimension
 * @returns Suffixed index name (e.g., "my_index_768")
 */
export function generateSuffixedIndexName(baseName: string, dimension: number): string {
	return `${baseName}_${dimension}`;
}
