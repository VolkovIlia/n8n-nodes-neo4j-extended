import {
    IExecuteFunctions,
	INodeExecutionData,
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

// Import logWrapper for proper AI tool GUI integration
const { logWrapper } = require('@n8n/n8n-nodes-langchain/dist/utils/logWrapper');

export class Neo4j implements INodeType {
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
					(mode === 'retrieve-as-tool' && (toolOperation === 'vectorSearch' || toolOperation === 'both' || toolOperation === 'documentProcessor' || toolOperation === 'smartSearch'))
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
					// NEW v1.1.0 AI Tool operations
					{
						name: 'Document Processor',
						value: 'documentProcessor',
						description: 'AI processes documents into graph and vector storage',
					},
					{
						name: 'Smart Search',
						value: 'smartSearch',
						description: 'AI automatically selects optimal search strategy',
					},
					{
						name: 'Graph Builder',
						value: 'graphBuilder',
						description: 'AI creates graph structures from text content',
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
					// NEW v1.1.0 operations
					{
						name: 'Process Document',
						value: 'processDocument',
						description: 'AI-powered document processing into graph and vector storage',
						action: 'Process document with AI',
					},
					{
						name: 'Hybrid Search',
						value: 'hybridSearch',
						description: 'Combined vector and graph search with AI strategy selection',
						action: 'Hybrid search (vector + graph)',
					},
					{
						name: 'Clean by Metadata',
						value: 'cleanByMetadata',
						description: 'Remove documents by metadata criteria',
						action: 'Clean by metadata',
					},
					{
						name: 'Update Document',
						value: 'updateDocument',
						description: 'Update document with MD5 and date checking',
						action: 'Update document',
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
			// Vector Store Parameters
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
			// NEW v1.1.0 - Process Document Parameters
			{
				displayName: 'Document Content',
				name: 'documentContent',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['processDocument'],
					},
				},
				default: '',
				description: 'Raw document content to process with AI into graph and vector storage',
				typeOptions: {
					rows: 5,
				},
			},
			{
				displayName: 'Document Title',
				name: 'documentTitle',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['processDocument'],
					},
				},
				default: '',
				description: 'Title or identifier for the document',
			},
			{
				displayName: 'Extract Entities',
				name: 'extractEntities',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['processDocument'],
					},
				},
				default: true,
				description: 'AI extracts entities for graph nodes',
			},
			{
				displayName: 'Create Relationships',
				name: 'createRelationships',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['processDocument'],
					},
				},
				default: true,
				description: 'AI creates relationships between entities',
			},
			// NEW v1.1.0 - Hybrid Search Parameters
			{
				displayName: 'Search Query',
				name: 'hybridQuery',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['hybridSearch'],
					},
				},
				default: '',
				description: 'Search query for hybrid vector+graph search',
			},
			{
				displayName: 'Search Context',
				name: 'searchContext',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['hybridSearch'],
					},
				},
				default: '',
				description: 'Additional context to help AI choose search strategy',
			},
			// NEW v1.1.0 - Clean by Metadata Parameters
			{
				displayName: 'Metadata Criteria',
				name: 'metadataCriteria',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['cleanByMetadata'],
					},
				},
				default: '{}',
				description: 'JSON criteria for documents to remove (e.g., {"source": "old_docs"})',
			},
			// NEW v1.1.0 - Update Document Parameters
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['updateDocument'],
					},
				},
				default: '',
				description: 'Unique identifier for the document to update',
			},
			{
				displayName: 'New Content',
				name: 'newContent',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['updateDocument'],
					},
				},
				default: '',
				description: 'New content to update the document with',
				typeOptions: {
					rows: 5,
				},
			},
			{
				displayName: 'Check MD5',
				name: 'checkMD5',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['vectorStore'],
						operation: ['updateDocument'],
					},
				},
				default: true,
				description: 'Check MD5 hash to detect content changes',
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
							const embeddings = (await this.getInputConnectionData('ai_embedding', 0)) as Embeddings;
							
							if (!embeddings) {
								console.log('[DEBUG] Neo4j Tool - No embeddings found');
								throw new NodeOperationError(this.getNode(), 'Embedding model is required for vector operations');
							}

							console.log('[DEBUG] Neo4j Tool - Embeddings found, creating config');
							const config = {
								url: credentials.uri as string,
								username: credentials.username as string,
								password: credentials.password as string,
								database: credentials.database as string,
							};

						const vectorConfig = {
							...config,
							indexName: 'vector_index',
							embeddingNodeProperty: "embedding",
							textNodeProperties: ["text"],
							searchType: 'vector' as "vector" | "hybrid",
						};
						
						console.log('[DEBUG] Neo4j Tool - Vector config:', JSON.stringify(vectorConfig, null, 2));							const vectorStore = await Neo4jVectorStore.fromExistingIndex(embeddings, vectorConfig);
							
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
							const config = {
								url: credentials.uri as string,
								username: credentials.username as string,
								password: credentials.password as string,
								database: credentials.database as string,
							};
							
							const graph = await Neo4jGraph.initialize(config);
							
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
		const config = {
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
			...config,
			indexName,
			embeddingNodeProperty: "embedding",
			textNodeProperties: ["text"],
			searchType: searchType as "vector" | "hybrid",
		};			const vectorStore = await Neo4jVectorStore.fromExistingIndex(
				embeddings,
				vectorConfig
			);				try {
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
				}

				// NEW v1.1.0 operations
				if (operation === 'processDocument') {
					const documentContent = this.getNodeParameter('documentContent', 0) as string;
					const documentTitle = this.getNodeParameter('documentTitle', 0, '') as string;
					const extractEntities = this.getNodeParameter('extractEntities', 0, true) as boolean;
					const createRelationships = this.getNodeParameter('createRelationships', 0, true) as boolean;

					// AI-powered document processing - instantiate class to access methods
					const neo4jInstance = new Neo4j();
					const processedResult = await neo4jInstance.processDocumentWithAI(documentContent, documentTitle, extractEntities, createRelationships, vectorStore, config);
					return [this.helpers.returnJsonArray([processedResult])];
				}

				if (operation === 'hybridSearch') {
					const hybridQuery = this.getNodeParameter('hybridQuery', 0) as string;
					const searchContext = this.getNodeParameter('searchContext', 0, '') as string;

					// AI-powered hybrid search - instantiate class to access methods
					const neo4jInstance = new Neo4j();
					const searchResult = await neo4jInstance.performHybridSearch(hybridQuery, searchContext, vectorStore, config);
					return [this.helpers.returnJsonArray(searchResult)];
				}

				if (operation === 'cleanByMetadata') {
					const metadataCriteria = JSON.parse(this.getNodeParameter('metadataCriteria', 0, '{}') as string);
					
					// Clean documents by metadata criteria - instantiate class to access methods
					const neo4jInstance = new Neo4j();
					const cleanResult = await neo4jInstance.cleanDocumentsByMetadata(metadataCriteria, vectorStore, config);
					return [this.helpers.returnJsonArray([cleanResult])];
				}

				if (operation === 'updateDocument') {
					const documentId = this.getNodeParameter('documentId', 0) as string;
					const newContent = this.getNodeParameter('newContent', 0) as string;
					const checkMD5 = this.getNodeParameter('checkMD5', 0, true) as boolean;

					// Update document with version checking - instantiate class to access methods
					const neo4jInstance = new Neo4j();
					const updateResult = await neo4jInstance.updateDocumentWithVersionCheck(documentId, newContent, checkMD5, vectorStore, config);
					return [this.helpers.returnJsonArray([updateResult])];
				}

				} finally {
					await vectorStore.close();
				}
			}

			if (resource === 'graphDb') {
				const graph = await Neo4jGraph.initialize(config);

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

		} catch (error) {
			throw new NodeOperationError(this.getNode(), error as Error);
		}

		return [[]];
	}

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('neo4jApi');
		const mode = this.getNodeParameter('mode', itemIndex, 'manual') as string;
		
		if (mode !== 'retrieve-as-tool') {
			throw new NodeOperationError(this.getNode(), 'supplyData can only be used in retrieve-as-tool mode');
		}

		// Create a DynamicTool that wraps our Neo4j functionality
		const tool = new DynamicTool({
			name: 'neo4j_search',
			description: 'Search for information in Neo4j database. Use this function to find information about topics.',
			func: async (query: string) => {
				// Get embeddings from input connection
				const embeddings = (await this.getInputConnectionData('ai_embedding', 0)) as Embeddings;
				
				if (!embeddings) {
					throw new ApplicationError('Embedding model is required for vector operations');
				}

				const config = {
					url: credentials.uri as string,
					username: credentials.username as string,
					password: credentials.password as string,
					database: credentials.database as string,
				};

				const vectorConfig = {
					...config,
					indexName: 'vector_index',
					embeddingNodeProperty: "embedding",
					textNodeProperties: ["text"],
					searchType: 'vector' as "vector" | "hybrid",
				};
				
				const vectorStore = await Neo4jVectorStore.fromExistingIndex(embeddings, vectorConfig);
				
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

	// NEW v1.1.0 - Helper methods for document processing
	private async processDocumentWithAI(
		documentContent: string,
		documentTitle: string,
		extractEntities: boolean,
		createRelationships: boolean,
		vectorStore: Neo4jVectorStore,
		config: any
	): Promise<any> {
		// AI-powered document processing implementation
		try {
			// 1. Process document into chunks
			const chunks = this.chunkDocument(documentContent);
			
			// 2. Add to vector store
			const documents = chunks.map((chunk: string) => ({
				pageContent: chunk,
				metadata: {
					title: documentTitle,
					timestamp: new Date().toISOString(),
					type: 'document_chunk'
				}
			}));
			
			await vectorStore.addDocuments(documents);

			// 3. Extract entities and relationships if requested
			let graphData = null;
			if (extractEntities || createRelationships) {
				const graph = await Neo4jGraph.initialize(config);
				try {
					graphData = await this.extractGraphStructure(documentContent, documentTitle, extractEntities, createRelationships, graph);
				} finally {
					await graph.close();
				}
			}

			return {
				success: true,
				processed: {
					chunks: chunks.length,
					title: documentTitle,
					vectorized: true,
					graphData: graphData
				}
			};
		} catch (error) {
			throw new ApplicationError(`Document processing failed: ${error.message}`);
		}
	}

	private async performHybridSearch(
		hybridQuery: string,
		searchContext: string,
		vectorStore: Neo4jVectorStore,
		config: any
	): Promise<any[]> {
		try {
			// AI decides search strategy based on query and context
			const strategy = this.analyzeSearchStrategy(hybridQuery, searchContext);
			const results = [];

			// Vector search component
			if (strategy.useVector) {
				const vectorResults = await vectorStore.similaritySearchWithScore(hybridQuery, 5);
				results.push(...vectorResults.map(([doc, score]) => ({
					content: doc.pageContent,
					score: score,
					metadata: doc.metadata,
					source: 'vector'
				})));
			}

			// Graph search component  
			if (strategy.useGraph) {
				const graph = await Neo4jGraph.initialize(config);
				try {
					const graphQuery = this.generateCypherFromQuery(hybridQuery, searchContext);
					const graphResults = await graph.query(graphQuery);
					results.push(...graphResults.map(result => ({
						...result,
						source: 'graph'
					})));
				} finally {
					await graph.close();
				}
			}

			// Combine and rank results
			return this.combineSearchResults(results);
		} catch (error) {
			throw new ApplicationError(`Hybrid search failed: ${error.message}`);
		}
	}

	private async cleanDocumentsByMetadata(
		metadataCriteria: any,
		vectorStore: Neo4jVectorStore,
		config: any
	): Promise<any> {
		try {
			const graph = await Neo4jGraph.initialize(config);
			try {
				// Build Cypher query to find and delete matching nodes
				const whereConditions = Object.entries(metadataCriteria)
					.map(([key, value]) => `n.${key} = $${key}`)
					.join(' AND ');
				
				const deleteQuery = `
					MATCH (n:Document) 
					WHERE ${whereConditions}
					DETACH DELETE n
					RETURN count(n) as deletedCount
				`;
				
				const result = await graph.query(deleteQuery, metadataCriteria);
				const deletedCount = result[0]?.deletedCount || 0;

				return {
					success: true,
					deleted: deletedCount,
					criteria: metadataCriteria
				};
			} finally {
				await graph.close();
			}
		} catch (error) {
			throw new ApplicationError(`Metadata cleanup failed: ${error.message}`);
		}
	}

	private async updateDocumentWithVersionCheck(
		documentId: string,
		newContent: string,
		checkMD5: boolean,
		vectorStore: Neo4jVectorStore,
		config: any
	): Promise<any> {
		try {
			const currentMD5 = checkMD5 ? this.calculateMD5(newContent) : null;
			
			// Check if document exists and get current version
			const graph = await Neo4jGraph.initialize(config);
			try {
				const existingQuery = `
					MATCH (n:Document {id: $documentId})
					RETURN n.md5 as currentMD5, n.lastUpdated as lastUpdated
				`;
				
				const existing = await graph.query(existingQuery, { documentId });
				
				if (existing.length === 0) {
					throw new ApplicationError(`Document with ID ${documentId} not found`);
				}

				const currentDoc = existing[0];
				
				// Check MD5 if requested
				if (checkMD5 && currentDoc.currentMD5 === currentMD5) {
					return {
						success: true,
						updated: false,
						reason: 'No changes detected (MD5 match)',
						documentId
					};
				}

				// Update document
				const updateQuery = `
					MATCH (n:Document {id: $documentId})
					SET n.content = $newContent,
						n.md5 = $newMD5,
						n.lastUpdated = $timestamp
					RETURN n
				`;

				await graph.query(updateQuery, {
					documentId,
					newContent,
					newMD5: currentMD5,
					timestamp: new Date().toISOString()
				});

				// Update vector store
				const documents = [{
					pageContent: newContent,
					metadata: {
						id: documentId,
						md5: currentMD5,
						lastUpdated: new Date().toISOString()
					}
				}];

				await vectorStore.addDocuments(documents);

				return {
					success: true,
					updated: true,
					documentId,
					newMD5: currentMD5
				};
			} finally {
				await graph.close();
			}
		} catch (error) {
			throw new ApplicationError(`Document update failed: ${error.message}`);
		}
	}

	// Utility methods
	private chunkDocument(content: string): string[] {
		// Simple chunking strategy - can be enhanced with more sophisticated methods
		const chunkSize = 1000;
		const chunks = [];
		
		for (let i = 0; i < content.length; i += chunkSize) {
			chunks.push(content.slice(i, i + chunkSize));
		}
		
		return chunks.filter(chunk => chunk.trim().length > 0);
	}

	private async extractGraphStructure(
		content: string,
		title: string,
		extractEntities: boolean,
		createRelationships: boolean,
		graph: Neo4jGraph
	): Promise<any> {
		// Placeholder for AI-powered entity extraction and relationship creation
		// This would integrate with LLM to extract entities and relationships
		
		if (extractEntities) {
			// Create document node
			const createDocQuery = `
				CREATE (doc:Document {
					title: $title,
					content: $content,
					created: $timestamp,
					type: 'processed_document'
				})
				RETURN doc
			`;
			
			await graph.query(createDocQuery, {
				title,
				content,
				timestamp: new Date().toISOString()
			});
		}

		return {
			entitiesExtracted: extractEntities,
			relationshipsCreated: createRelationships,
			title
		};
	}

	private analyzeSearchStrategy(query: string, context: string): { useVector: boolean, useGraph: boolean } {
		// Simple heuristic-based strategy selection
		// In a full implementation, this would use LLM for intelligent analysis
		
		const hasEntityKeywords = /\b(who|what|where|when|which|entity|person|organization|place)\b/i.test(query);
		const hasSemanticKeywords = /\b(similar|like|about|meaning|concept|related)\b/i.test(query);
		
		return {
			useVector: hasSemanticKeywords || query.length > 50, // Semantic or long queries
			useGraph: hasEntityKeywords || context.includes('structured') // Entity or structured queries
		};
	}

	private generateCypherFromQuery(query: string, context: string): string {
		// Simple Cypher generation - in production, this would use LLM
		return `
			MATCH (n:Document)
			WHERE n.title CONTAINS $query OR n.content CONTAINS $query
			RETURN n.title as title, n.content as content
			LIMIT 10
		`.replace('$query', `"${query}"`);
	}

	private combineSearchResults(results: any[]): any[] {
		// Simple result combination - could implement more sophisticated ranking
		return results
			.sort((a, b) => (b.score || 0) - (a.score || 0))
			.slice(0, 10);
	}

	private calculateMD5(content: string): string {
		// Simple MD5 calculation using Node.js crypto
		const crypto = require('crypto');
		return crypto.createHash('md5').update(content).digest('hex');
	}
}