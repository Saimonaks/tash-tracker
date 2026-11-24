const path = require('path');
const express = require('express');
const tasksRouter = require('./routes/tasks');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

// 1. Логирование всех запросов
app.use(logger);

// 2. Разбор JSON-тела запроса в req.body
app.use(express.json());

// 3. Раздача клиентской части из папки www
app.use(express.static(path.join(__dirname, '..', 'www')));

// 4. Маршруты API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Временный маршрут для проверки обработки ошибок (пункт 8) — после скриншота удалить!
app.get('/api/test-error', (req, res) => {
  throw new Error('test');
});

app.use('/api/tasks', tasksRouter);

// 5. Неизвестный маршрут внутри /api → 404
app.use('/api', notFound);

// 6. Централизованный обработчик ошибок → 500
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сайт и API запущены: http://localhost:${PORT}`);
});