# 📦 NPM Publication Guide

## 🚀 **Публикация n8n-nodes-neo4j-extended на npmjs.com**

### **Предварительная подготовка:**

#### 1. **Регистрация на npm (если нет аккаунта):**
```bash
# Зарегистрироваться на https://www.npmjs.com/signup
# Подтвердить email
```

#### 2. **Авторизация в терминале:**
```bash
npm login
# Ввести: username, password, email
# Подтвердить через OTP если включен 2FA
```

#### 3. **Проверка авторизации:**
```bash
npm whoami
# Должно вернуть ваш username
```

### **Публикация пакета:**

#### 4. **Финальная проверка package.json:**
- ✅ Версия: 1.0.1
- ✅ Имя: n8n-nodes-neo4j-extended  
- ✅ Описание и keywords заполнены
- ✅ Homepage и repository указаны
- ✅ License: MIT

#### 5. **Сборка проекта:**
```bash
npm run build
# Должно пройти без ошибок
```

#### 6. **Проверка содержимого пакета:**
```bash
npm pack --dry-run
# Показывает, что попадет в пакет
```

#### 7. **Публикация:**
```bash
npm publish
# Пакет будет опубликован на npmjs.com
```

### **После публикации:**

#### 8. **Проверка публикации:**
- Перейти на https://www.npmjs.com/package/n8n-nodes-neo4j-extended
- Убедиться, что пакет доступен
- Проверить README и метаданные

#### 9. **Установка в n8n:**
```bash
# В n8n Community Nodes
n8n-nodes-neo4j-extended
```

## ⚠️ **Важные моменты:**

### **Требования npm:**
- Уникальное имя пакета (n8n-nodes-neo4j-extended должно быть свободно)
- Валидный package.json
- MIT лицензия (совместима с n8n)

### **n8n Community Node требования:**
- ✅ Префикс "n8n-nodes-" в названии
- ✅ Keyword "n8n-community-node-package"
- ✅ Правильная структура папок (nodes/, credentials/)
- ✅ Compiled JavaScript в dist/

### **После публикации:**
- Пакет станет доступен для установки через n8n UI
- Пользователи смогут найти его в Community Nodes
- Обновления публикуются через `npm publish` с новой версией

## 🎯 **Команды для выполнения:**

```bash
# 1. Авторизация
npm login

# 2. Проверка
npm whoami

# 3. Сборка  
npm run build

# 4. Публикация
npm publish

# 5. Проверка
echo "Проверить на https://www.npmjs.com/package/n8n-nodes-neo4j-extended"
```

**После успешной публикации можно начинать разработку v1.1.0!** 🚀