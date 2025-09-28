CREATE VECTOR INDEX vector_index IF NOT EXISTS 
FOR (d:Document) ON (d.embedding) 
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 1536, 
    `vector.similarity_function`: 'cosine'
  }
}