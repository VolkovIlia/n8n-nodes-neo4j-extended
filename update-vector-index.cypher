// Удаляем старый индекс с размерностью 1536
DROP INDEX vector_index IF EXISTS;

// Создаем новый индекс для GigaChat embeddings с максимальной поддерживаемой размерностью 2048
CREATE VECTOR INDEX vector_index 
FOR (doc:Document) ON (doc.embedding) 
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 2048, 
    `vector.similarity_function`: 'COSINE'
  }
};

// Проверяем создание индекса
SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, options 
WHERE name = 'vector_index';