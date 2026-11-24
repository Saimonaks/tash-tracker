function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}

module.exports = { notFound, errorHandler };