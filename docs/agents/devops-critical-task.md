# КРИТИЧЕСКАЯ ЗАДАЧА для DevOps Agent

## Проблемы инфраструктуры
1. **n8n устаревшая версия**: текущая 1.69.1, нужна latest
2. **Плагин не установлен**: требуется правильная установка в контейнер
3. **Community package integration**: настройка для n8n-nodes-neo4j-extended

## Немедленные действия

### A. Обновить docker-compose.yml
```yaml
# Обновить n8n до latest версии
n8n:
  image: n8nio/n8n:latest  # вместо 1.69.1
  
# Добавить правильную установку community node
volumes:
  - ./dist:/home/node/.n8n/custom-nodes/n8n-nodes-neo4j-extended
  - ./package.json:/home/node/.n8n/custom-nodes/n8n-nodes-neo4j-extended/package.json

environment:
  - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom-nodes
```

### B. Создать инсталляционный скрипт
- Автоматическая установка зависимостей в контейнер
- Proper linking для community node
- Verification скрипты для проверки установки

### C. Environment validation
- Проверка всех зависимостей (@langchain/community, neo4j-driver)
- Validation установки плагина в n8n
- Health checks для всех компонентов

## Приоритет: КРИТИЧЕСКИЙ
Без решения этих инфраструктурных проблем тестирование невозможно.