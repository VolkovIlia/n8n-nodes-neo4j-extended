# Neo4j n8n Node Testing Guide

## Setup Test Environment

1. **Start the test environment:**
```bash
# Build the node
npm run build

# Start Neo4j and n8n containers
docker-compose up -d

# Wait for services to be ready
docker-compose logs -f
```

2. **Access the services:**
- Neo4j Browser: http://localhost:7474 (neo4j/testpassword)
- n8n Interface: http://localhost:5678 (admin/testpassword)

## Testing Scenarios

### 1. Vector Store Operations

#### Test Similarity Search
- **Resource**: Vector Store
- **Operation**: Similarity Search
- **Query Text**: "artificial intelligence machine learning"
- **K**: 3
- **Search Type**: hybrid
- **Expected**: Returns relevant documents about AI/ML

#### Test Add Texts
- **Resource**: Vector Store  
- **Operation**: Add Texts
- **Texts**: 
  - "Quantum computing will revolutionize cryptography"
  - "Blockchain technology enables decentralized applications"
- **Expected**: Successfully adds texts to vector index

### 2. Graph Database Operations

#### Test Execute Query
- **Resource**: Graph Database
- **Operation**: Execute Query
- **Query**: 
```cypher
MATCH (p:Person)-[:WORKS_FOR]->(c:Company)
RETURN p.name as employee, p.occupation as role, c.name as company
```
- **Expected**: Returns employee information

#### Test Create Node
- **Resource**: Graph Database
- **Operation**: Create Node
- **Label**: Person
- **Properties**: 
```json
{
  "name": "Eva",
  "age": 29,
  "occupation": "Data Scientist"
}
```
- **Expected**: Creates new Person node

#### Test Create Relationship
- **Resource**: Graph Database
- **Operation**: Create Relationship
- **From Node Query**: `MATCH (a:Person {name: "Eva"})`
- **To Node Query**: `MATCH (b:Company {name: "Tech Corp"})`
- **Relationship Type**: WORKS_FOR
- **Properties**:
```json
{
  "since": 2024,
  "role": "Senior Data Scientist"
}
```
- **Expected**: Creates relationship between Eva and Tech Corp

#### Test Get Schema
- **Resource**: Graph Database
- **Operation**: Get Schema
- **Format**: structured
- **Expected**: Returns database schema information

### 3. AI Tool Integration

#### Test as LangChain Tool
1. Create AI Agent node
2. Add Neo4j node with Vector Store operations
3. Connect via ai_tool output
4. Test agent can use Neo4j for knowledge retrieval

## Validation Checklist

- [ ] Neo4j connection established successfully
- [ ] Vector operations work with embedding models
- [ ] Graph queries execute correctly
- [ ] Nodes and relationships created properly
- [ ] Schema retrieval functional
- [ ] AI tool integration works with agents
- [ ] Error handling works for invalid inputs
- [ ] Metadata filtering functions correctly
- [ ] Hybrid search returns relevant results

## Common Issues and Solutions

### Connection Issues
- Check Neo4j is running: `docker-compose ps`
- Verify credentials: neo4j/testpassword
- Check URI format: neo4j://localhost:7687

### Vector Search Issues
- Ensure embedding model is connected
- Verify vector index exists in Neo4j
- Check embedding dimensions match

### Performance Issues
- Monitor memory usage: `docker stats`
- Check Neo4j query performance in browser
- Verify indexed properties for queries

## Docker Commands

```bash
# View logs
docker-compose logs neo4j
docker-compose logs n8n

# Restart services
docker-compose restart

# Clean up
docker-compose down -v

# Rebuild and restart
docker-compose down -v && npm run build && docker-compose up -d
```

## MCP Server Integration

If using with MCP server for testing:

```bash
# Install n8n MCP server
npm install -g @leonardsellem/n8n-mcp-server

# Configure Claude Desktop or VS Code with MCP server
# Point to the n8n instance: http://localhost:5678
```