# Broadcast Module - Модуль рассылок

Модуль для массовой рассылки сообщений пользователям бота администратором.

## Функциональность

- Создание и управление рассылками (название, статус, контент)
- Отправка рассылок всем пользователям бота
- Отслеживание отправленных сообщений для исключения повторной отправки
- HTTP API с Basic Authentication для админ-доступа

## API Endpoints

Все endpoints защищены Basic Authentication. Используйте логин и пароль из переменных окружения.

### Переменные окружения

Добавьте в `.env`:
```
BROADCAST_ADMIN_LOGIN=admin
BROADCAST_ADMIN_PASSWORD=your_secure_password
```

### Endpoints

#### 1. Создать/Обновить рассылку
```
POST /broadcast/create
Authorization: Basic <base64(login:password)>

Body:
{
  "name": "welcome_message",
  "content": "Привет! Это тестовая рассылка",
  "isActive": true
}
```

#### 2. Отправить рассылку
```
POST /broadcast/send
Authorization: Basic <base64(login:password)>

Body:
{
  "broadcastName": "welcome_message"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Broadcast sent successfully",
  "result": {
    "success": 150,
    "failed": 5,
    "skipped": 10,
    "total": 165
  }
}
```

#### 3. Список всех рассылок
```
GET /broadcast/list
Authorization: Basic <base64(login:password)>
```

#### 4. Статистика по рассылке
```
GET /broadcast/stats/:broadcastName
Authorization: Basic <base64(login:password)>
```

## Использование

### Пример создания рассылки через curl:

```bash
# Создать рассылку
curl -X POST http://localhost:3000/broadcast/create \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome_message",
    "content": "Добро пожаловать! Это тестовая рассылка.",
    "isActive": true
  }'

# Отправить рассылку
curl -X POST http://localhost:3000/broadcast/send \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "broadcastName": "welcome_message"
  }'
```

## Особенности

- **Автоматическая проверка дублей**: Система проверяет, была ли уже отправлена рассылка пользователю, и пропускает повторную отправку
- **Batch обработка**: Рассылка отправляется батчами по 50 пользователей параллельно для оптимизации
- **Обработка ошибок**: Если пользователь заблокировал бота, ошибка логируется, но процесс продолжается
- **Статистика**: Возвращается подробная статистика по успешным, неудачным и пропущенным отправкам

## Модели данных

### Broadcast
- `name` (string, unique) - название рассылки
- `isActive` (boolean) - статус активности
- `content` (string) - контент сообщения

### BroadcastSent
- `broadcastName` (string) - название рассылки
- `chatId` (number) - ID чата пользователя
- `sentAt` (Date) - дата отправки
- `error` (string, optional) - ошибка при отправке (если была)

Уникальный индекс: `{ broadcastName: 1, chatId: 1 }` - предотвращает повторную отправку одному пользователю

