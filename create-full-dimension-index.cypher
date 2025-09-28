// Создаем векторный индекс для GigaChat embeddings с полной размерностью 2560
// Neo4j 5.18+ поддерживает до 4096 размерностей
CREATE VECTOR INDEX vector_index 
FOR (doc:Document) ON (doc.embedding) 
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 2560, 
    `vector.similarity_function`: 'COSINE'
  }
};

// Проверяем создание индекса
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options 
WHERE name = 'vector_index';