#!/bin/bash

# Инсталляционный скрипт для n8n community node
# Выполняется внутри n8n контейнера

echo "🚀 Установка n8n-nodes-neo4j-extended..."

# Создаем директорию для community nodes если её нет
mkdir -p /home/node/.n8n/custom/n8n-nodes-neo4j-extended

# Копируем собранные файлы
cp -r /home/node/.n8n/custom/n8n-nodes-neo4j-extended/dist/* /home/node/.n8n/custom/n8n-nodes-neo4j-extended/

# Устанавливаем зависимости
cd /home/node/.n8n/custom/n8n-nodes-neo4j-extended
npm install --production

# Создаем символическую ссылку
cd /home/node/.n8n
ln -sf custom/n8n-nodes-neo4j-extended nodes/n8n-nodes-neo4j-extended

echo "✅ Установка завершена"

# Проверяем установку
echo "🔍 Проверка установки..."
if [ -f "/home/node/.n8n/nodes/n8n-nodes-neo4j-extended/package.json" ]; then
    echo "✅ Package.json найден"
else
    echo "❌ Package.json не найден"
    exit 1
fi

if [ -d "/home/node/.n8n/nodes/n8n-nodes-neo4j-extended/dist" ]; then
    echo "✅ Dist директория найдена"
else 
    echo "❌ Dist директория не найдена"
    exit 1
fi

echo "🎉 n8n-nodes-neo4j-extended успешно установлен!"