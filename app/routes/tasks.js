const express = require('express');
const tasks = require('../data/tasks.json');

const router = express.Router();

let nextId = Math.max(0, ...tasks.map((t) => t.id)) + 1;

const CATEGORY_LABELS = {
  work: 'Работа',
  study: 'Учёба',
  home: 'Быт',
  other: 'Другое'
};

const PRIORITY_LABELS = {
  1: 'Обычный',
  2: 'Высокий',
  3: 'Критический'
};

// partial = true для PATCH: проверяем только присланные поля
function validateTask(body, partial = false) {
  const errors = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.title = 'Название задачи обязательно';
    } else if (body.title.trim().length > 100) {
      errors.title = 'Название не должно превышать 100 символов';
    }
  }

  if (!partial || body.priority !== undefined) {
    if (!Number.isInteger(body.priority) || body.priority < 1 || body.priority > 3) {
      errors.priority = 'Приоритет должен быть целым числом от 1 до 3';
    }
  }

  if (!partial || body.deadline !== undefined) {
    if (typeof body.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
      errors.deadline = 'Дедлайн обязателен в формате ГГГГ-ММ-ДД';
    }
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !CATEGORY_LABELS[body.category]) {
      errors.category = 'Допустимые категории: work, study, home, other';
    }
  }

  if (body.reminder !== undefined) {
    if (typeof body.reminder !== 'string' || body.reminder.trim().length > 100) {
      errors.reminder = 'Текст напоминания должен быть строкой до 100 символов';
    }
  }

  return errors;
}

// GET /api/tasks?category=study&search=отчёт&sort=priority
router.get('/', (req, res) => {
  const { category, search, sort } = req.query;
  let items = [...tasks];

  if (category && category !== 'all') {
    items = items.filter((t) => t.category === category);
  }

  if (search) {
    const q = search.trim().toLowerCase();
    items = items.filter((t) => t.title.toLowerCase().includes(q));
  }

  if (sort === 'priority') {
    items.sort((a, b) => b.priority - a.priority);
  } else if (sort === 'deadline') {
    items.sort((a, b) => a.deadline.localeCompare(b.deadline));
  } else if (sort === 'title') {
    items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  res.json(items);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const item = tasks.find((t) => t.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }
  res.json(item);
});

// POST /api/tasks — создание новой задачи
router.post('/', (req, res) => {
  const body = req.body ?? {};
  const errors = validateTask(body, false);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Ошибка валидации', fields: errors });
  }

  const category = body.category ?? 'other';
  const priority = body.priority;

  const item = {
    id: nextId++, // id назначает сервер, присланный клиентом игнорируется
    title: body.title.trim(),
    deadline: body.deadline,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    priority,
    priorityLabel: PRIORITY_LABELS[priority],
    reminder: body.reminder ? body.reminder.trim() : 'Раз в день'
  };

  tasks.push(item);
  res.status(201).json(item);
});

// PATCH /api/tasks/:id — частичное обновление задачи
router.patch('/:id', (req, res) => {
  const item = tasks.find((t) => t.id === Number(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  const body = req.body ?? {};
  const errors = validateTask(body, true);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Ошибка валидации', fields: errors });
  }

  if (body.title !== undefined) item.title = body.title.trim();
  if (body.deadline !== undefined) item.deadline = body.deadline;
  if (body.category !== undefined) {
    item.category = body.category;
    item.categoryLabel = CATEGORY_LABELS[body.category];
  }
  if (body.priority !== undefined) {
    item.priority = body.priority;
    item.priorityLabel = PRIORITY_LABELS[body.priority];
  }
  if (body.reminder !== undefined) item.reminder = body.reminder.trim();

  res.json(item);
});

// DELETE /api/tasks/:id — удаление задачи
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

module.exports = router;