# Quick Start Guide - n8n Neo4j Extended

## Installation

### Option 1: npm (Recommended)
```bash
# Install globally in n8n
npm install -g n8n-nodes-neo4j-extended

# Or install locally in your n8n project
npm install n8n-nodes-neo4j-extended
```

### Option 2: Development Setup
```bash
# Clone repository
git clone https://github.com/VolkovIlia/n8n-nodes-neo4j-extended.git
cd n8n-nodes-neo4j-extended

# Install dependencies
npm install

# Build
npm run build

# Link to global n8n
npm link
```

## Quick Test with Docker

### 1. Start Test Environment
```bash
# Build the node
npm run build

# Start Neo4j + n8n
docker-compose up -d

# Check services are running
docker-compose ps
```

### 2. Access Services
- **n8n**: http://localhost:5678 (admin/password123)
- **Neo4j Browser**: http://localhost:7474 (neo4j/password123) 

### 3. Configure n8n Credentials
In n8n interface:
1. Go to Credentials → Add Credential
2. Search for "Neo4j API"
3. Configure:
   - **Connection URI**: `neo4j://neo4j:7687`
   - **Username**: `neo4j`
   - **Password**: `password123`
   - **Database**: `neo4j`
4. Test connection → Save

### 4. Create First Workflow

#### Simple Graph Query Example:
1. Add Neo4j node
2. Set Resource: "Graph Database"
3. Set Operation: "Execute Query"
4. Query: `MATCH (p:Person) RETURN p.name, p.occupation LIMIT 5`
5. Execute workflow

#### Vector Search Example (requires embedding model):
1. Add embedding model node (e.g., OpenAI Embeddings)
2. Add Neo4j node
3. Connect embedding to Neo4j ai_embedding input
4. Configure Neo4j:
   - Resource: "Vector Store"
   - Operation: "Similarity Search"
   - Query Text: "artificial intelligence"
   - K: 3
5. Execute workflow

## Common Issues

### Connection Problems
- Check Neo4j container: `docker logs neo4j-test`
- Verify URI format: `neo4j://neo4j:7687` (for Docker)
- Test in Neo4j Browser first

### Node Not Appearing
- Restart n8n: `docker-compose restart n8n`
- Check n8n logs: `docker logs n8n-test`
- Verify build artifacts in `/dist` folder

### Vector Operations Failing
- Ensure embedding model is connected
- Check Neo4j version supports vectors (5.x+)
- Verify vector index exists

## Next Steps

1. Read full [README.md](./README.md) for detailed operations
2. Review [TESTING.md](./TESTING.md) for comprehensive test scenarios
3. Check [examples/](./examples/) for workflow templates
4. Join [n8n Community](https://community.n8n.io) for support

## Production Deployment

For production use:
1. Use proper Neo4j cluster setup
2. Configure secure authentication
3. Set up monitoring and logging
4. Use environment variables for credentials
5. Consider n8n Cloud or self-hosted setup

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/VolkovIlia/n8n-nodes-neo4j-extended/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/VolkovIlia/n8n-nodes-neo4j-extended/discussions)
- 📚 n8n Community: [community.n8n.io](https://community.n8n.io)