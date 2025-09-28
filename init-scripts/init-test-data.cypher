// Создание тестовых данных для Neo4j
// Очистка базы данных
MATCH (n) DETACH DELETE n;

// Создание компаний
CREATE (techCorp:Company {
    name: "Tech Corp", 
    industry: "Technology", 
    founded: 2010,
    employees: 150,
    location: "San Francisco"
});

CREATE (aiLabs:Company {
    name: "AI Labs", 
    industry: "Artificial Intelligence", 
    founded: 2018,
    employees: 75,
    location: "New York"
});

CREATE (dataInc:Company {
    name: "Data Inc", 
    industry: "Data Analytics", 
    founded: 2015,
    employees: 200,
    location: "London"
});

// Создание людей
CREATE (john:Person {
    name: "John Smith", 
    age: 32, 
    occupation: "Software Engineer",
    skills: ["Python", "JavaScript", "Neo4j"],
    experience: 8
});

CREATE (sarah:Person {
    name: "Sarah Johnson", 
    age: 28, 
    occupation: "Data Scientist",
    skills: ["Python", "Machine Learning", "TensorFlow"],
    experience: 5
});

CREATE (mike:Person {
    name: "Mike Davis", 
    age: 35, 
    occupation: "DevOps Engineer",
    skills: ["Docker", "Kubernetes", "AWS"],
    experience: 10
});

CREATE (anna:Person {
    name: "Anna Wilson", 
    age: 30, 
    occupation: "AI Researcher",
    skills: ["Machine Learning", "Deep Learning", "PyTorch"],
    experience: 7
});

CREATE (tom:Person {
    name: "Tom Brown", 
    age: 26, 
    occupation: "Frontend Developer",
    skills: ["React", "Vue.js", "TypeScript"],
    experience: 4
});

CREATE (lisa:Person {
    name: "Lisa Martinez", 
    age: 29, 
    occupation: "Database Administrator",
    skills: ["Neo4j", "PostgreSQL", "MongoDB"],
    experience: 6
});

// Создание связей работы
MATCH (john:Person {name: "John Smith"}), (techCorp:Company {name: "Tech Corp"})
CREATE (john)-[:WORKS_FOR {since: 2020, position: "Senior Software Engineer", salary: 120000}]->(techCorp);

MATCH (sarah:Person {name: "Sarah Johnson"}), (aiLabs:Company {name: "AI Labs"})
CREATE (sarah)-[:WORKS_FOR {since: 2021, position: "Senior Data Scientist", salary: 130000}]->(aiLabs);

MATCH (mike:Person {name: "Mike Davis"}), (techCorp:Company {name: "Tech Corp"})
CREATE (mike)-[:WORKS_FOR {since: 2019, position: "Lead DevOps Engineer", salary: 140000}]->(techCorp);

MATCH (anna:Person {name: "Anna Wilson"}), (aiLabs:Company {name: "AI Labs"})
CREATE (anna)-[:WORKS_FOR {since: 2022, position: "AI Research Lead", salary: 150000}]->(aiLabs);

MATCH (tom:Person {name: "Tom Brown"}), (techCorp:Company {name: "Tech Corp"})
CREATE (tom)-[:WORKS_FOR {since: 2023, position: "Frontend Developer", salary: 95000}]->(techCorp);

MATCH (lisa:Person {name: "Lisa Martinez"}), (dataInc:Company {name: "Data Inc"})
CREATE (lisa)-[:WORKS_FOR {since: 2021, position: "Senior DBA", salary: 110000}]->(dataInc);

// Создание связей коллегиальности
MATCH (john:Person {name: "John Smith"}), (mike:Person {name: "Mike Davis"})
CREATE (john)-[:COLLEAGUE_OF {since: 2020, relationship: "close"}]->(mike);
CREATE (mike)-[:COLLEAGUE_OF {since: 2020, relationship: "close"}]->(john);

MATCH (john:Person {name: "John Smith"}), (tom:Person {name: "Tom Brown"})
CREATE (john)-[:MENTOR_OF {since: 2023, area: "backend development"}]->(tom);

MATCH (sarah:Person {name: "Sarah Johnson"}), (anna:Person {name: "Anna Wilson"})
CREATE (sarah)-[:COLLEAGUE_OF {since: 2021, relationship: "research partners"}]->(anna);
CREATE (anna)-[:COLLEAGUE_OF {since: 2021, relationship: "research partners"}]->(sarah);

// Создание проектов
CREATE (project1:Project {
    name: "ML Platform",
    description: "Machine learning platform for data processing",
    status: "active",
    budget: 500000,
    start_date: "2023-01-15",
    technologies: ["Python", "TensorFlow", "Neo4j"]
});

CREATE (project2:Project {
    name: "Data Pipeline",
    description: "Real-time data processing pipeline",
    status: "completed",
    budget: 300000,
    start_date: "2022-06-01",
    end_date: "2023-03-15",
    technologies: ["Apache Kafka", "Spark", "Docker"]
});

CREATE (project3:Project {
    name: "AI Assistant",
    description: "Intelligent chatbot for customer support",
    status: "planning",
    budget: 750000,
    start_date: "2024-01-01",
    technologies: ["LLM", "Vector Database", "React"]
});

// Связывание проектов с компаниями и людьми
MATCH (project1:Project {name: "ML Platform"}), (aiLabs:Company {name: "AI Labs"})
CREATE (aiLabs)-[:SPONSORS {investment: 400000}]->(project1);

MATCH (project2:Project {name: "Data Pipeline"}), (techCorp:Company {name: "Tech Corp"})
CREATE (techCorp)-[:SPONSORS {investment: 300000}]->(project2);

MATCH (project3:Project {name: "AI Assistant"}), (dataInc:Company {name: "Data Inc"})
CREATE (dataInc)-[:SPONSORS {investment: 500000}]->(project3);

MATCH (sarah:Person {name: "Sarah Johnson"}), (project1:Project {name: "ML Platform"})
CREATE (sarah)-[:WORKS_ON {role: "Lead Data Scientist", hours_per_week: 40}]->(project1);

MATCH (anna:Person {name: "Anna Wilson"}), (project1:Project {name: "ML Platform"})
CREATE (anna)-[:WORKS_ON {role: "AI Researcher", hours_per_week: 35}]->(project1);

MATCH (mike:Person {name: "Mike Davis"}), (project2:Project {name: "Data Pipeline"})
CREATE (mike)-[:WORKS_ON {role: "DevOps Lead", hours_per_week: 40}]->(project2);

MATCH (john:Person {name: "John Smith"}), (project2:Project {name: "Data Pipeline"})
CREATE (john)-[:WORKS_ON {role: "Backend Developer", hours_per_week: 30}]->(project2);

// Создание документов для векторного поиска
CREATE (doc1:Document {
    id: "doc_001",
    title: "Neo4j Vector Search Guide",
    content: "Comprehensive guide to implementing vector search in Neo4j. Covers similarity search, embedding integration, and hybrid queries for advanced graph analytics.",
    category: "technical",
    author: "Database Team",
    created_date: "2024-01-15",
    tags: ["neo4j", "vector", "search", "embeddings"]
});

CREATE (doc2:Document {
    id: "doc_002", 
    title: "Machine Learning with Graph Databases",
    content: "Exploring the intersection of machine learning and graph databases. Learn how to leverage graph structures for improved ML model performance and feature engineering.",
    category: "research",
    author: "AI Research Team",
    created_date: "2024-02-20",
    tags: ["machine learning", "graph", "neo4j", "ai"]
});

CREATE (doc3:Document {
    id: "doc_003",
    title: "Building Scalable Data Pipelines", 
    content: "Best practices for building scalable data pipelines using modern technologies like Apache Kafka, Spark, and containerization with Docker and Kubernetes.",
    category: "engineering",
    author: "DevOps Team", 
    created_date: "2024-03-10",
    tags: ["data pipeline", "kafka", "spark", "devops"]
});

CREATE (doc4:Document {
    id: "doc_004",
    title: "Advanced Cypher Query Optimization",
    content: "Deep dive into Cypher query optimization techniques. Learn about index usage, query planning, and performance tuning for complex graph traversals.",
    category: "technical",
    author: "Database Team",
    created_date: "2024-04-05", 
    tags: ["cypher", "optimization", "performance", "neo4j"]
});

CREATE (doc5:Document {
    id: "doc_005",
    title: "AI-Driven Graph Analytics",
    content: "Implementing artificial intelligence algorithms for graph analytics. Covers graph neural networks, community detection, and predictive modeling on graph data.",
    category: "research",
    author: "AI Research Team", 
    created_date: "2024-05-12",
    tags: ["ai", "graph analytics", "gnn", "machine learning"]
});

// Связывание документов с проектами и людьми
MATCH (doc1:Document {id: "doc_001"}), (project1:Project {name: "ML Platform"})
CREATE (doc1)-[:RELATES_TO {relevance: "high"}]->(project1);

MATCH (doc2:Document {id: "doc_002"}), (project1:Project {name: "ML Platform"})
CREATE (doc2)-[:RELATES_TO {relevance: "high"}]->(project1);

MATCH (doc3:Document {id: "doc_003"}), (project2:Project {name: "Data Pipeline"})
CREATE (doc3)-[:RELATES_TO {relevance: "high"}]->(project2);

MATCH (doc1:Document {id: "doc_001"}), (lisa:Person {name: "Lisa Martinez"})
CREATE (lisa)-[:AUTHORED {contribution: "primary"}]->(doc1);

MATCH (doc4:Document {id: "doc_004"}), (lisa:Person {name: "Lisa Martinez"})
CREATE (lisa)-[:AUTHORED {contribution: "primary"}]->(doc4);

// Создание индексов для оптимизации поиска
CREATE INDEX person_name_index IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX company_name_index IF NOT EXISTS FOR (c:Company) ON (c.name);
CREATE INDEX project_name_index IF NOT EXISTS FOR (proj:Project) ON (proj.name);
CREATE INDEX document_id_index IF NOT EXISTS FOR (d:Document) ON (d.id);
CREATE INDEX document_category_index IF NOT EXISTS FOR (d:Document) ON (d.category);
CREATE FULLTEXT INDEX document_content_index IF NOT EXISTS FOR (d:Document) ON EACH [d.title, d.content];

// Возврат статистики созданных данных
MATCH (n)
WITH labels(n) AS nodeLabels
UNWIND nodeLabels AS label
RETURN label, COUNT(*) as count
ORDER BY label;