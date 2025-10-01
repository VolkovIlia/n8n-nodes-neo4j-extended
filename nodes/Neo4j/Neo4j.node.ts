import {
    IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	NodeOperationError,
	ApplicationError,
	SupplyData,
} from 'n8n-workflow';
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';
import { Neo4jVectorStore } from '@langchain/community/vectorstores/neo4j_vector';
import { DynamicTool } from '@langchain/core/tools';
import type { Embeddings } from '@langchain/core/embeddings';
import type { Driver as Neo4jDriver } from 'neo4j-driver';

// Import vector index helper functions
import {
	checkIndexExists,
	createVectorIndex,
	deleteVectorIndex,
	listVectorIndexes,
	getIndexInfo,
	detectEmbeddingDimension,
	generateSuffixedIndexName,
} from './neo4jVectorIndexHelpers';

// Import logWrapper for proper AI tool GUI integration
const { logWrapper } = require('@n8n/n8n-nodes-langchain/dist/utils/logWrapper');

const ROUTING_ERROR_REGEX = /Could not perform discovery|No routing servers available/i;

type Neo4jConnectionConfig = {
        url: string;
        username: string;
        password: string;
        database?: string;
        [key: string]: unknown;
};

function shouldRetryWithDirectConnection(error: unknown, url: string): boolean {
        if (typeof url !== 'string' || !url.startsWith('neo4j')) {
                return false;
        }

        const message = error instanceof Error ? error.message : '';
        return ROUTING_ERROR_REGEX.test(message);
}

function toDirectBoltUri(uri: string): string {
        if (uri.startsWith('neo4j+ssc://')) {
                return uri.replace('neo4j+ssc://', 'bolt+ssc://');
        }
        if (uri.startsWith('neo4j+s://')) {
                return uri.replace('neo4j+s://', 'bolt+s://');
        }
        if (uri.startsWith('neo4j://')) {
                return uri.replace('neo4j://', 'bolt://');
        }
        return uri;
}

async function initializeGraphWithFallback(config: Neo4jConnectionConfig) {
        try {
                return await Neo4jGraph.initialize(config);
        } catch (error) {
                if (!shouldRetryWithDirectConnection(error, config.url)) {
                        throw error;
                }

                const fallbackConfig = { ...config, url: toDirectBoltUri(config.url) };
                return Neo4jGraph.initialize(fallbackConfig);
        }
}

async function initializeVectorStoreWithFallback(
        embeddings: Embeddings,
        config: Neo4jConnectionConfig,
		autoCreate = true,
) {
		const indexName = config.indexName as string || 'vector_index';
		const nodeLabel = config.nodeLabel as string || 'Chunk';
		const embeddingNodeProperty = config.embeddingNodeProperty as string || 'embedding';
		
		// Auto-create logic: check if index exists, create if missing with detected dimension
		if (autoCreate) {
			const neo4j = require('neo4j-driver');
			const driver: Neo4jDriver = neo4j.driver(
				config.url,
				neo4j.auth.basic(config.username, config.password)
			);

			try {
				// Step 1: Detect embedding dimension
				const detectedDimension = await detectEmbeddingDimension(embeddings);

				// Step 2: Check if index exists
				const indexCheck = await checkIndexExists(driver, indexName, config.database as string | undefined);

				if (!indexCheck.exists) {
					// Index doesn't exist - create it with detected dimension
					await createVectorIndex(
						driver,
						indexName,
						nodeLabel,
						embeddingNodeProperty,
						detectedDimension,
						'cosine', // Default similarity function
						config.database as string | undefined
					);
				} else if (indexCheck.dimension && indexCheck.dimension !== detectedDimension) {
					// Index exists but dimension mismatch - create suffixed index
					const suffixedName = generateSuffixedIndexName(indexName, detectedDimension);
					
					// Check if suffixed index already exists
					const suffixedCheck = await checkIndexExists(driver, suffixedName, config.database as string | undefined);
					
					if (!suffixedCheck.exists) {
						await createVectorIndex(
							driver,
							suffixedName,
							nodeLabel,
							embeddingNodeProperty,
							detectedDimension,
							'cosine',
							config.database as string | undefined
						);
					}
					
					// Update config to use suffixed index
					config.indexName = suffixedName;
				}
				// If index exists with correct dimension, proceed normally
			} catch (autoCreateError) {
				// Log auto-create failure but don't block - proceed with fromExistingIndex
				console.warn('Auto-create vector index failed:', autoCreateError);
			} finally {
				await driver.close();
			}
		}

		// Original fallback logic for connection handling
        try {
                return await Neo4jVectorStore.fromExistingIndex(embeddings, config);
        } catch (error) {
                if (!shouldRetryWithDirectConnection(error, config.url)) {
                        throw error;
                }

                const fallbackConfig = { ...config, url: toDirectBoltUri(config.url) };
                return Neo4jVectorStore.fromExistingIndex(embeddings, fallbackConfig);
        }
}

export class Neo4j implements INodeType {
	methods = {
		loadOptions: {
			async getVectorIndexes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
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

						// Return empty message if no indexes found
						if (indexes.length === 0) {
							return [
								{ name: 'No Indexes Found - Type Custom Name', value: '' }
							];
						}

						// Convert to dropdown format
						return indexes.map(index => ({
							name: `${index.name} (${index.dimension}D, ${index.nodeLabel}.${index.property})`,
							value: index.name,
						}));
					} finally {
						await driver.close();
					}
				} catch (error) {
					// Log error and return empty array
					console.error('Failed to load vector indexes:', error);
					return [
						{ name: 'Error Loading Indexes - Type Custom Name', value: '' }
					];
				}
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Neo4j',
		name: 'neo4j',
		icon: 'file:neo4j.svg',
		usableAsTool: true,
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with Neo4j graph database and vector search',
		defaults: {
			name: 'Neo4j',
		},
		inputs: `={{
			((parameters) => {
				const mode = parameters?.mode || 'manual';
				const resource = parameters?.resource;
				const toolOperation = parameters?.toolOperation;
				const inputs = [{ displayName: "", type: "main"}];

				// Add embedding input for vector operations
				const needsEmbedding = (
					// Manual mode with vector store resource
					(mode === 'manual' && resource === 'vectorStore') ||
					// AI Tool mode with vector search capability
					(mode === 'retrieve-as-tool' && (toolOperation === 'vectorSearch' || toolOperation === 'both'))
				);

				if (needsEmbedding) {
					inputs.push({ displayName: "Embedding", type: "ai_embedding", required: true, maxConnections: 1});
				}
				return inputs;
			})($parameter)
		}}`,
		outputs: ['main', 'ai_tool'],
		credentials: [
			{
				name: 'neo4jApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Manual',
						value: 'manual',
						description: 'Run Neo4j operations manually',
					},
					{
						name: 'Retrieve as Tool for AI Agent',
						value: 'retrieve-as-tool', 
						description: 'Use as a tool that an AI agent can call',
					},
				],
				default: 'manual',
			},
			{
				displayName: 'Tool Description',
				name: 'toolDescription', 
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						mode: ['retrieve-as-tool'],
					},
				},
				default: 'Search for information in Neo4j graph database and vector store. Useful for finding related documents, graph relationships, and semantic similarity.',
				description: 'Description of what this tool does, will be passed to the AI agent',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						mode: ['manual'],
					},
				},
				options: [
					{
						name: 'Vector Store',
						value: 'vectorStore',
						description: 'Vector similarity search and embeddings operations',
					},
					{
						name: 'Graph Database',
						value: 'graphDb',
						description: 'Graph database operations with Cypher queries',
					},
					{
						name: 'Vector Index Management',
						value: 'vectorIndexManagement',
						description: 'Create, delete, and manage vector indexes',
					},
				],
				default: 'vectorStore',
			},
			{
				displayName: 'Tool Operation',
				name: 'toolOperation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						mode: ['retrieve-as-tool'],
					},
				},
				options: [
					{
						name: 'Vector Search',
						value: 'vectorSearch',
						description: 'Semantic search in vector store using embeddings',
					},
					{
						name: 'Graph Query',
						value: 'graphQuery',
						description: 'Execute Cypher queries on graph database',
					},
					{
						name: 'Both (Vector + Graph)',
						value: 'both',
						description: 'AI can choose between vector search and graph queries',
					},
				],
				default: 'both',
			},
			// Vector Store Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
					},
				},
				options: [
					{
						name: 'Similarity Search',
						value: 'similaritySearch',
						description: 'Search for similar vectors',
						action: 'Search for similar vectors',
					},
					{
						name: 'Add Texts',
						value: 'addTexts',
						description: 'Add texts to vector store',
						action: 'Add texts to vector store',
					},
					{
						name: 'Add Documents',
						value: 'addDocuments',
						description: 'Add documents to vector store',
						action: 'Add documents to vector store',
					},
				],
				default: 'similaritySearch',
			},
			// Graph Database Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
					},
				},
				options: [
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Execute a Cypher query',
						action: 'Execute cypher query',
					},
					{
						name: 'Create Node',
						value: 'createNode',
						description: 'Create a new node',
						action: 'Create new node',
					},
					{
						name: 'Create Relationship',
						value: 'createRelationship',
						description: 'Create a relationship between nodes',
						action: 'Create relationship',
					},
					{
						name: 'Get Schema',
						value: 'getSchema',
						description: 'Get database schema information',
						action: 'Get database schema',
					},
				],
				default: 'executeQuery',
			},
			// Vector Index Management Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
					},
				},
				options: [
					{
						name: 'Create Index',
						value: 'createIndex',
						description: 'Create a new vector index',
						action: 'Create vector index',
					},
					{
						name: 'Delete Index',
						value: 'deleteIndex',
						description: 'Delete an existing vector index',
						action: 'Delete vector index',
					},
					{
						name: 'List Indexes',
						value: 'listIndexes',
						description: 'List all vector indexes',
						action: 'List vector indexes',
					},
					{
						name: 'Get Index Info',
						value: 'getIndexInfo',
						description: 'Get detailed information about a vector index',
						action: 'Get vector index info',
					},
				],
				default: 'listIndexes',
			},
			// Vector Store Parameters
			{
				displayName: 'Index Name or ID',
				name: 'indexName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getVectorIndexes',
				},
				displayOptions: {
					show: {
						resource: ['vectorStore'],
					},
				},
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Query Text',
				name: 'queryText',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['similaritySearch'],
					},
				},
				default: 'Enter search query here...',
				description: 'The text to search for similar vectors',
			},
			{
				displayName: 'K (Number of Results)',
				name: 'k',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['similaritySearch'],
					},
				},
				default: 4,
				description: 'Number of similar results to return',
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Search Type',
				name: 'searchType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['similaritySearch'],
					},
				},
				options: [
					{
						name: 'Vector',
						value: 'vector',
						description: 'Pure vector similarity search',
					},
					{
						name: 'Hybrid',
						value: 'hybrid',
						description: 'Hybrid search combining vector and fulltext',
					},
				],
				default: 'vector',
				description: 'Type of search to perform',
			},
			{
				displayName: 'Metadata Filter',
				name: 'metadataFilter',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['similaritySearch'],
					},
				},
				default: '{}',
				description: 'JSON object to filter results by metadata properties',
			},
			{
				displayName: 'Texts',
				name: 'texts',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['addTexts'],
					},
				},
				default: [],
				description: 'The texts to add to the vector store',
			},
			{
				displayName: 'Documents',
				name: 'documents',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['addDocuments'],
					},
				},
				default: '[]',
				description: 'Array of document objects with pageContent and metadata',
			},
			// Graph DB Parameters
			{
				displayName: 'Cypher Query',
				name: 'cypherQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['executeQuery'],
					},
				},
				default: '',
				description: 'The Cypher query to execute',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['executeQuery'],
					},
				},
				default: '{}',
				description: 'Parameters for the Cypher query as JSON object',
			},
			{
				displayName: 'Node Label',
				name: 'nodeLabel',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createNode'],
					},
				},
				default: '',
				description: 'The label for the node',
			},
			{
				displayName: 'Node Properties',
				name: 'nodeProperties',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createNode'],
					},
				},
				default: '{}',
				description: 'The properties of the node as JSON object',
			},
			{
				displayName: 'From Node Query',
				name: 'fromNodeQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createRelationship'],
					},
				},
				default: '',
				description: 'Cypher query to match the source node (e.g., MATCH (a:Person {name: "Alice"})',
			},
			{
				displayName: 'To Node Query',
				name: 'toNodeQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createRelationship'],
					},
				},
				default: '',
				description: 'Cypher query to match the target node (e.g., MATCH (b:Person {name: "Bob"})',
			},
			{
				displayName: 'Relationship Type',
				name: 'relationshipType',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createRelationship'],
					},
				},
				default: '',
				description: 'Type of relationship to create (e.g., KNOWS, WORKS_WITH)',
			},
			{
				displayName: 'Relationship Properties',
				name: 'relationshipProperties',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['createRelationship'],
					},
				},
				default: '{}',
				description: 'Properties of the relationship as JSON object',
			},
			{
				displayName: 'Schema Format',
				name: 'schemaFormat',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['graphDb'],
						operation: ['getSchema'],
					},
				},
				options: [
					{
						name: 'Structured',
						value: 'structured',
						description: 'Get structured schema object',
					},
					{
						name: 'String',
						value: 'string',
						description: 'Get schema as formatted string',
					},
				],
				default: 'structured',
				description: 'Format of the schema output',
			},
			// Vector Index Management Parameters
			{
				displayName: 'Index Name',
				name: 'indexNameManagement',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
						operation: ['createIndex', 'deleteIndex', 'getIndexInfo'],
					},
				},
				default: 'my_vector_index',
				description: 'Name of the vector index',
			},
			{
				displayName: 'Node Label',
				name: 'nodeLabel',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
						operation: ['createIndex'],
					},
				},
				default: 'Chunk',
				description: 'Label of the nodes to index',
			},
			{
				displayName: 'Embedding Property',
				name: 'embeddingProperty',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
						operation: ['createIndex'],
					},
				},
				default: 'embedding',
				description: 'Property containing the embedding vectors',
			},
			{
				displayName: 'Dimension',
				name: 'dimension',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
						operation: ['createIndex'],
					},
				},
				default: 1536,
				description: 'Vector dimension (e.g., 1536 for OpenAI, 768 for Sentence Transformers, 2048 for GigaChat)',
				typeOptions: {
					minValue: 1,
					maxValue: 4096,
				},
			},
			{
				displayName: 'Similarity Function',
				name: 'similarityFunction',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['vectorIndexManagement'],
						operation: ['createIndex'],
					},
				},
				options: [
					{
						name: 'Cosine',
						value: 'cosine',
						description: 'Cosine similarity (recommended for most cases)',
					},
					{
						name: 'Euclidean',
						value: 'euclidean',
						description: 'Euclidean distance',
					},
				],
				default: 'cosine',
				description: 'Similarity function to use for vector comparison',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('neo4jApi');
		const mode = this.getNodeParameter('mode', 0, 'manual') as string;
		
		// Handle AI Tool mode
		if (mode === 'retrieve-as-tool') {
			// Check if this is a tool call with parameters (from AI Agent)
			const inputData = this.getInputData();
			console.log('[DEBUG] Neo4j Tool - Input data:', JSON.stringify(inputData, null, 2));
			console.log('[DEBUG] Neo4j Tool - Input data length:', inputData.length);
			
			// Check workflow execution context
			const executionContext = this.getContext('node');
			console.log('[DEBUG] Neo4j Tool - Execution context keys:', Object.keys(executionContext));
			
			// If we have input data with function call parameters, execute the tool
			if (inputData.length > 0 && inputData[0].json) {
				const toolInput = inputData[0].json;
				console.log('[DEBUG] Neo4j Tool - Tool input:', JSON.stringify(toolInput, null, 2));
				console.log('[DEBUG] Neo4j Tool - Tool input keys:', Object.keys(toolInput));
				console.log('[DEBUG] Neo4j Tool - Has query?', !!toolInput.query);
				console.log('[DEBUG] Neo4j Tool - Has cypher_query?', !!toolInput.cypher_query);
				
				// Check if this is an actual function call (has query parameter)
				if (toolInput.query || toolInput.cypher_query) {
					console.log('[DEBUG] Neo4j Tool - This is a function call, executing...');
					// This is an actual tool execution - handle it inline
					try {
						// Handle vector search
						if (toolInput.operation_type === 'vector_search' || toolInput.query) {
							console.log('[DEBUG] Neo4j Tool - Starting vector search');
							// Get embeddings from input connection
							const embeddings = (await this.getInputConnectionData(
					'ai_embedding',
					0,
				)) as Embeddings;
							
							if (!embeddings) {
								console.log('[DEBUG] Neo4j Tool - No embeddings found');
								throw new NodeOperationError(this.getNode(), 'Embedding model is required for vector operations');
							}

							console.log('[DEBUG] Neo4j Tool - Embeddings found, creating config');
							const baseConfig: Neo4jConnectionConfig = {
								url: credentials.uri as string,
								username: credentials.username as string,
								password: credentials.password as string,
								database: credentials.database as string,
							};

						const vectorConfig = {
							...baseConfig,
							indexName: 'vector_index',
							embeddingNodeProperty: 'embedding',
							textNodeProperty: 'text',
							searchType: 'vector' as const,
						};
						
						console.log('[DEBUG] Neo4j Tool - Vector config:', JSON.stringify(vectorConfig, null, 2));
							const vectorStore = await initializeVectorStoreWithFallback(embeddings, vectorConfig);
							
							try {
								const queryText = toolInput.query as string;
								console.log('[DEBUG] Neo4j Tool - Query text:', queryText);
								
								if (!queryText) {
									throw new NodeOperationError(this.getNode(), 'Query text is required for vector search');
								}
								const k = 5; // Default number of results
								
								console.log('[DEBUG] Neo4j Tool - Executing similarity search with k =', k);
								const results = await vectorStore.similaritySearchWithScore(queryText, k);
								console.log('[DEBUG] Neo4j Tool - Search results count:', results.length);
								console.log('[DEBUG] Neo4j Tool - Results:', JSON.stringify(results.slice(0, 2), null, 2)); // Log first 2 results
								
								const formattedResults = results.map(([doc, score]) => ({
									text: doc.pageContent,
									score: score,
									metadata: doc.metadata,
									source: 'vector_search'
								}));
								
								console.log('[DEBUG] Neo4j Tool - Formatted results:', JSON.stringify(formattedResults.slice(0, 2), null, 2));
								return [this.helpers.returnJsonArray(formattedResults)];
							} finally {
								await vectorStore.close();
							}
						}

						// Handle graph query
						if (toolInput.operation_type === 'cypher_query' || toolInput.cypher_query) {
							const baseConfig: Neo4jConnectionConfig = {
								url: credentials.uri as string,
								username: credentials.username as string,
								password: credentials.password as string,
								database: credentials.database as string,
							};
							
							const graph = await initializeGraphWithFallback(baseConfig);
							
							try {
								const cypherQuery = toolInput.cypher_query as string;
								if (!cypherQuery) {
									throw new NodeOperationError(this.getNode(), 'Cypher query is required for graph operations');
								}
								const result = await graph.query(cypherQuery);
								
								return [this.helpers.returnJsonArray(result.map((item: any) => ({
									...item,
									source: 'cypher_query'
								})))];
							} finally {
								await graph.close();
							}
						}

						throw new NodeOperationError(this.getNode(), 'Invalid tool operation or missing required parameters');

					} catch (error) {
						throw new NodeOperationError(this.getNode(), error as Error);
					}
				} else {
					console.log('[DEBUG] Neo4j Tool - No parameters provided, returning error message');
					// AI Agent called function but didn't provide parameters
					return [[{ 
						json: { 
							error: "Function called without parameters. Please provide either 'query' for vector search or 'cypher_query' for graph operations.",
							example_usage: {
								vector_search: {
									operation_type: "vector_search",
									query: "your search text here"
								},
								cypher_query: {
									operation_type: "cypher_query", 
									cypher_query: "MATCH (n) RETURN n LIMIT 10"
								}
							}
						}, 
						pairedItem: { item: 0 } 
					}]];
				}
			}
			
			// Return tool definition for AI Agent registration - handle inline
			
			const tool = {
				type: 'function',
				function: {
					name: 'neo4j_search',
					description: 'Search information in Neo4j database. Use this function to find information about topics.',
					parameters: {
						type: 'object',
						properties: {
							query: {
								type: 'string',
								description: 'Search query text to find information',
							},
						},
						required: ['query'],
					},
				},
			};

			console.log('[NEO4J AI TOOL] Final tool definition:', JSON.stringify(tool, null, 2));
			console.log('[NEO4J AI TOOL] Schema validation - name:', tool.function.name);
			console.log('[NEO4J AI TOOL] Schema validation - description:', tool.function.description);
			console.log('[NEO4J AI TOOL] Schema validation - parameters:', JSON.stringify(tool.function.parameters));
			console.log('[NEO4J AI TOOL] Schema validation - required:', tool.function.parameters.required);
			return [[{ json: tool, pairedItem: { item: 0 } }]];
		}
		
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Neo4j connection configuration
		const baseConfig: Neo4jConnectionConfig = {
			url: credentials.uri as string,
			username: credentials.username as string,
			password: credentials.password as string,
			database: credentials.database as string,
		};

		try {
			if (resource === 'vectorStore') {
				// Get embeddings from input connection
				const embeddings = (await this.getInputConnectionData(
					'ai_embedding',
					0,
				)) as Embeddings;
				
				if (!embeddings) {
					throw new NodeOperationError(this.getNode(), 'Embedding model is required for vector operations');
				}

				const indexName = this.getNodeParameter('indexName', 0) as string;
				const searchType = this.getNodeParameter('searchType', 0, 'vector') as string;

				// Vector store configuration
				const vectorConfig = {
					...baseConfig,
					indexName,
					embeddingNodeProperty: 'embedding',
					textNodeProperty: 'text',
					searchType: searchType as 'vector' | 'hybrid',
				};

				const vectorStore = await initializeVectorStoreWithFallback(embeddings, vectorConfig);

				try {
					if (operation === 'similaritySearch') {
						const queryText = this.getNodeParameter('queryText', 0) as string;
						const k = this.getNodeParameter('k', 0, 4) as number;
						const metadataFilterStr = this.getNodeParameter('metadataFilter', 0, '{}') as string;
						const metadataFilter = JSON.parse(metadataFilterStr);

						const results = await vectorStore.similaritySearchWithScore(queryText, k, metadataFilter);
						
						return [this.helpers.returnJsonArray(results.map(([doc, score]) => ({
							content: doc.pageContent,
							score: score,
							metadata: doc.metadata
						})))];
					}

					if (operation === 'addTexts') {
						const texts = this.getNodeParameter('texts', 0) as string[];
						const documents = texts.map(text => ({ pageContent: text, metadata: {} }));
						
						await vectorStore.addDocuments(documents);
						return [this.helpers.returnJsonArray([{ success: true, added: texts.length }])];
					}

				if (operation === 'addDocuments') {
					// Try to get documents from parameter first
					let documents = [];
					
					try {
						const documentsParam = this.getNodeParameter('documents', 0, '[]') as string;
						documents = JSON.parse(documentsParam);
					} catch (paramError) {
						// If parameter is empty or invalid, try to extract from input data
						const inputData = this.getInputData(0);
						
						if (inputData && inputData.length > 0) {
							const item = inputData[0];
							
							// Check if it's from form trigger with file upload
							if (item.json && item.binary) {
								const fileKeys = Object.keys(item.binary);
								
								for (const key of fileKeys) {
									const fileData = item.binary[key];
									if (fileData && fileData.data) {
										// Convert binary data to text
										const content = Buffer.from(fileData.data, 'base64').toString('utf-8');
										documents.push({
											pageContent: content,
											metadata: {
												filename: fileData.fileName || 'uploaded_file',
												mimeType: fileData.mimeType || 'text/plain'
											}
						});
					}
				}
							} else if (item.json) {
								// Handle regular JSON input
								const content = typeof item.json === 'string' ? item.json : JSON.stringify(item.json);
								documents.push({
									pageContent: content,
									metadata: item.json
								});
							}
						}
					}
					
					if (documents.length === 0) {
						throw new NodeOperationError(this.getNode(), 'No documents found. Please provide documents parameter or input data with files/text.');
					}
					
					await vectorStore.addDocuments(documents);
					return [this.helpers.returnJsonArray([{ success: true, added: documents.length }])];
				}				} finally {
					await vectorStore.close();
				}
			}

			if (resource === 'graphDb') {
				const graph = await initializeGraphWithFallback(baseConfig);

				try {
					if (operation === 'getSchema') {
						const schemaFormat = this.getNodeParameter('schemaFormat', 0) as string;
						
						let result: any;
						if (schemaFormat === 'string') {
							result = { schema: await graph.getSchema() };
						} else {
							result = await graph.getStructuredSchema();
						}
						
						return [this.helpers.returnJsonArray([result])];
					}

					if (operation === 'executeQuery') {
						const cypherQuery = this.getNodeParameter('cypherQuery', 0) as string;
						const queryParametersStr = this.getNodeParameter('queryParameters', 0, '{}') as string;
						const queryParameters = JSON.parse(queryParametersStr);
						
						const result = await graph.query(cypherQuery, queryParameters);
						return [this.helpers.returnJsonArray(result)];
					}

					if (operation === 'createNode') {
						const nodeLabel = this.getNodeParameter('nodeLabel', 0) as string;
						const nodePropertiesStr = this.getNodeParameter('nodeProperties', 0) as string;
						const nodeProperties = JSON.parse(nodePropertiesStr);
						
						const query = `CREATE (n:${nodeLabel} $props) RETURN n`;
						const result = await graph.query(query, { props: nodeProperties });
						return [this.helpers.returnJsonArray(result)];
					}

					if (operation === 'createRelationship') {
						const fromNodeQuery = this.getNodeParameter('fromNodeQuery', 0) as string;
						const toNodeQuery = this.getNodeParameter('toNodeQuery', 0) as string;
						const relationshipType = this.getNodeParameter('relationshipType', 0) as string;
						const relationshipPropertiesStr = this.getNodeParameter('relationshipProperties', 0, '{}') as string;
						const relationshipProperties = JSON.parse(relationshipPropertiesStr);
						
						// Build compound Cypher query for relationship creation
						const query = `
							${fromNodeQuery} 
							${toNodeQuery.replace('MATCH', 'WITH a MATCH')}
							CREATE (a)-[r:${relationshipType} $props]->(b)
							RETURN a, r, b
						`;
						
						const result = await graph.query(query, { props: relationshipProperties });
						return [this.helpers.returnJsonArray(result)];
					}

				} finally {
					await graph.close();
				}
			}

			// Vector Index Management Operations
			if (resource === 'vectorIndexManagement') {
				const neo4j = require('neo4j-driver');
				const driver: Neo4jDriver = neo4j.driver(
					baseConfig.url,
					neo4j.auth.basic(baseConfig.username, baseConfig.password)
				);

				try {
					if (operation === 'listIndexes') {
						const indexes = await listVectorIndexes(driver, baseConfig.database as string | undefined);
						// Convert to IDataObject[]
						const indexesData = indexes.map(idx => ({
							name: idx.name,
							nodeLabel: idx.nodeLabel,
							property: idx.property,
							dimension: idx.dimension,
							similarityFunction: idx.similarityFunction,
							state: idx.state,
						}));
						return [this.helpers.returnJsonArray(indexesData)];
					}

					if (operation === 'getIndexInfo') {
						const indexName = this.getNodeParameter('indexNameManagement', 0) as string;
						const indexInfo = await getIndexInfo(driver, indexName, baseConfig.database as string | undefined);
						
						if (!indexInfo) {
							throw new NodeOperationError(
								this.getNode(),
								`Vector index "${indexName}" not found`
							);
						}
						
						// Convert to IDataObject
						const indexData = {
							name: indexInfo.name,
							nodeLabel: indexInfo.nodeLabel,
							property: indexInfo.property,
							dimension: indexInfo.dimension,
							similarityFunction: indexInfo.similarityFunction,
							state: indexInfo.state,
						};
						return [this.helpers.returnJsonArray([indexData])];
					}

					if (operation === 'createIndex') {
						const indexName = this.getNodeParameter('indexNameManagement', 0) as string;
						const nodeLabel = this.getNodeParameter('nodeLabel', 0) as string;
						const embeddingProperty = this.getNodeParameter('embeddingProperty', 0) as string;
						const dimension = this.getNodeParameter('dimension', 0) as number;
						const similarityFunction = this.getNodeParameter('similarityFunction', 0, 'cosine') as 'cosine' | 'euclidean';

						// Check if index already exists
						const existsCheck = await checkIndexExists(driver, indexName, baseConfig.database as string | undefined);
						
						if (existsCheck.exists) {
							throw new NodeOperationError(
								this.getNode(),
								`Vector index "${indexName}" already exists with dimension ${existsCheck.dimension}`
							);
						}

						await createVectorIndex(
							driver,
							indexName,
							nodeLabel,
							embeddingProperty,
							dimension,
							similarityFunction,
							baseConfig.database as string | undefined
						);

						return [this.helpers.returnJsonArray([{
							success: true,
							indexName,
							nodeLabel,
							embeddingProperty,
							dimension,
							similarityFunction,
						}])];
					}

					if (operation === 'deleteIndex') {
						const indexName = this.getNodeParameter('indexNameManagement', 0) as string;

						// Check if index exists before deleting
						const existsCheck = await checkIndexExists(driver, indexName, baseConfig.database as string | undefined);
						
						if (!existsCheck.exists) {
							throw new NodeOperationError(
								this.getNode(),
								`Vector index "${indexName}" does not exist`
							);
						}

						await deleteVectorIndex(driver, indexName, baseConfig.database as string | undefined);

						return [this.helpers.returnJsonArray([{
							success: true,
							deletedIndex: indexName,
						}])];
					}

				} finally {
					await driver.close();
				}
			}

		} catch (error) {
			throw new NodeOperationError(this.getNode(), error as Error);
		}

		return [[]];
	}

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('neo4jApi');
		
		// Get mode parameter - if not explicitly set, assume we're being called as a tool
		let mode: string;
		try {
			mode = this.getNodeParameter('mode', itemIndex, 'retrieve-as-tool') as string;
		} catch (error) {
			// If parameter access fails, assume tool mode
			mode = 'retrieve-as-tool';
		}
		
		// supplyData is only called when node is used as AI tool, so we should accept it
		if (mode !== 'retrieve-as-tool') {
			// Instead of throwing error, log warning and proceed
			console.warn('[Neo4j Tool] supplyData called but mode is not retrieve-as-tool. Proceeding anyway as this is expected for AI tool usage.');
		}

		// Create a DynamicTool that wraps our Neo4j functionality
		const tool = new DynamicTool({
			name: 'neo4j_search',
			description: 'Search for information in Neo4j database. Use this function to find information about topics.',
			func: async (query: string) => {
				// Get embeddings from input connection
				const embeddings = (await this.getInputConnectionData(
					'ai_embedding',
					0,
				)) as Embeddings;
				
				if (!embeddings) {
					throw new ApplicationError('Embedding model is required for vector operations');
				}

				const baseConfig: Neo4jConnectionConfig = {
					url: credentials.uri as string,
					username: credentials.username as string,
					password: credentials.password as string,
					database: credentials.database as string,
				};

				const vectorConfig = {
					...baseConfig,
					indexName: 'vector_index',
					embeddingNodeProperty: 'embedding',
					textNodeProperty: 'text',
					searchType: 'vector' as const,
				};
				
				const vectorStore = await initializeVectorStoreWithFallback(embeddings, vectorConfig);
				
				try {
					const results = await vectorStore.similaritySearchWithScore(query, 5);
					
					const formattedResults = results.map(([doc, score]) => ({
						text: doc.pageContent,
						score: score,
						metadata: doc.metadata,
						source: 'vector_search'
					}));
					
					// Return formatted results as a readable string for AI Agent
					const resultText = formattedResults.map((result, index) => 
						`Result ${index + 1} (score: ${result.score.toFixed(3)}):\n${result.text}\n`
					).join('\n---\n');
					
					return resultText;
				} finally {
					await vectorStore.close();
				}
			}
		});
		
		return {
			response: logWrapper(tool, this),
		};
	}
}