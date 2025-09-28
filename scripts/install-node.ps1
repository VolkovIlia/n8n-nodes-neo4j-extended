# PowerShell скрипт для установки community node в n8n контейнер
# install-node.ps1

Write-Host "🚀 Установка n8n-nodes-neo4j-extended в контейнер..." -ForegroundColor Green

# Сборка проекта
Write-Host "📦 Сборка проекта..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки проекта" -ForegroundColor Red
    exit 1
}

# Остановка контейнеров
Write-Host "🛑 Остановка контейнеров..." -ForegroundColor Yellow
docker-compose down

# Создание директории для custom nodes в volume
Write-Host "📁 Создание директорий..." -ForegroundColor Yellow
docker volume create n8n_data

# Запуск контейнеров с новой конфигурацией
Write-Host "🚀 Запуск обновленных контейнеров..." -ForegroundColor Yellow
docker-compose up -d

# Ожидание запуска n8n
Write-Host "⏳ Ожидание запуска n8n..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Копирование файлов в контейнер и установка
Write-Host "📋 Установка community node..." -ForegroundColor Yellow

# Создаем директории внутри контейнера
docker exec n8n-test mkdir -p /home/node/.n8n/custom/n8n-nodes-neo4j-extended

# Копируем dist и package.json
docker exec n8n-test cp -r /home/node/.n8n/custom/n8n-nodes-neo4j-extended/dist /tmp/dist
docker exec n8n-test cp /home/node/.n8n/custom/n8n-nodes-neo4j-extended/package.json /tmp/package.json

# Устанавливаем зависимости
docker exec n8n-test sh -c "cd /home/node/.n8n/custom/n8n-nodes-neo4j-extended && npm install --production"

# Перезапуск n8n для подключения нового node
Write-Host "🔄 Перезапуск n8n..." -ForegroundColor Yellow
docker restart n8n-test

# Ожидание полного запуска
Start-Sleep -Seconds 20

# Проверка установки
Write-Host "🔍 Проверка установки..." -ForegroundColor Yellow
$checkResult = docker exec n8n-test ls -la /home/node/.n8n/custom/n8n-nodes-neo4j-extended/

if ($checkResult -match "package.json") {
    Write-Host "✅ n8n-nodes-neo4j-extended успешно установлен!" -ForegroundColor Green
    Write-Host "🌐 n8n доступен по адресу: http://localhost:5678" -ForegroundColor Cyan
    Write-Host "👤 Логин: ilia.volkov@outlook.com" -ForegroundColor Cyan
    Write-Host "🔑 Пароль: Password123" -ForegroundColor Cyan
} else {
    Write-Host "❌ Ошибка установки community node" -ForegroundColor Red
    exit 1
}