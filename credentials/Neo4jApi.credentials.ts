import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Neo4jApi implements ICredentialType {
	name = 'neo4jApi';
	displayName = 'Neo4j API';
	documentationUrl = 'https://neo4j.com/docs/getting-started/';
	properties: INodeProperties[] = [
		{
			displayName: 'Connection URI',
			name: 'uri',
			type: 'string',
			default: 'neo4j://localhost:7687',
			required: true,
			description: 'The connection URI for the Neo4j database (e.g., neo4j://localhost:7687, neo4j+s://xxx.databases.neo4j.io)',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: 'neo4j',
			required: true,
			description: 'Username for Neo4j authentication',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Password for Neo4j authentication',
		},
		{
			displayName: 'Database',
			name: 'database',
			type: 'string',
			default: 'neo4j',
			required: true,
			description: 'Name of the Neo4j database to connect to',
		},
	];

	// Authentication configuration for HTTP requests
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Content-Type': 'application/json',
			},
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	// NOTE: Credential testing removed intentionally
	// Neo4j connections через bolt:// и neo4j:// протоколы невозможно протестировать
	// стандартными HTTP методами n8n. Соединение будет проверено при первом использовании в workflow.
	// Это стандартная практика для Neo4j community nodes (см. https://github.com/Kurea/n8n-nodes-neo4j)
}