// Neo4j initialization script for testing n8n-nodes-neo4j-extended

// Create sample nodes and relationships
CREATE (alice:Person {name: 'Alice', age: 30, occupation: 'Engineer'})
CREATE (bob:Person {name: 'Bob', age: 25, occupation: 'Designer'})
CREATE (charlie:Person {name: 'Charlie', age: 35, occupation: 'Manager'})
CREATE (diana:Person {name: 'Diana', age: 28, occupation: 'Developer'})

CREATE (company:Company {name: 'Tech Corp', founded: 2010, industry: 'Technology'})
CREATE (project1:Project {name: 'AI Platform', status: 'Active', priority: 'High'})
CREATE (project2:Project {name: 'Mobile App', status: 'Completed', priority: 'Medium'})

// Create relationships
CREATE (alice)-[:WORKS_FOR {since: 2020, role: 'Senior Engineer'}]->(company)
CREATE (bob)-[:WORKS_FOR {since: 2021, role: 'Lead Designer'}]->(company)
CREATE (charlie)-[:WORKS_FOR {since: 2018, role: 'Project Manager'}]->(company)
CREATE (diana)-[:WORKS_FOR {since: 2022, role: 'Full Stack Developer'}]->(company)

CREATE (alice)-[:KNOWS {since: 2020, relationship: 'colleague'}]->(bob)
CREATE (alice)-[:KNOWS {since: 2020, relationship: 'colleague'}]->(diana)
CREATE (bob)-[:KNOWS {since: 2021, relationship: 'friend'}]->(diana)
CREATE (charlie)-[:MANAGES]->(alice)
CREATE (charlie)-[:MANAGES]->(bob)
CREATE (charlie)-[:MANAGES]->(diana)

CREATE (alice)-[:WORKS_ON {role: 'Lead Developer'}]->(project1)
CREATE (diana)-[:WORKS_ON {role: 'Backend Developer'}]->(project1)
CREATE (bob)-[:WORKS_ON {role: 'UI/UX Designer'}]->(project2)

// Create vector index for similarity search testing
// Note: This requires Neo4j 5.x with vector capabilities
// CREATE VECTOR INDEX vector FOR (n:Document) ON (n.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}

// Create sample documents for vector search (without actual embeddings for now)
CREATE (doc1:Document {
  text: 'Artificial Intelligence is transforming the way we work and live.',
  title: 'AI Revolution',
  category: 'technology',
  published_year: 2023
})

CREATE (doc2:Document {
  text: 'Machine Learning algorithms can predict customer behavior patterns.',
  title: 'ML in Business',
  category: 'technology', 
  published_year: 2022
})

CREATE (doc3:Document {
  text: 'Graph databases provide powerful relationship insights for complex data.',
  title: 'Graph Database Benefits',
  category: 'database',
  published_year: 2023
})

CREATE (doc4:Document {
  text: 'Vector search enables semantic similarity matching in large datasets.',
  title: 'Vector Search Guide',
  category: 'database',
  published_year: 2023
})

CREATE (doc5:Document {
  text: 'Natural Language Processing helps computers understand human language.',
  title: 'NLP Fundamentals',
  category: 'technology',
  published_year: 2022
})

// Create some fulltext indexes for hybrid search
CREATE FULLTEXT INDEX documentText FOR (n:Document) ON EACH [n.text, n.title]