console.log('Скрипт www/js/script.js успешно подключен');

// =========================================================
// ЧАСТЬ 1. ОБРАБОТКА СОБЫТИЙ (ЛР № 6)
// =========================================================

// 1.1. Счётчик выполненных задач
const counterEl = document.querySelector('#tasks-counter');
const completeBtn = document.querySelector('#complete-task-btn');
let completedTasks = 0;

if (counterEl && completeBtn) {
  counterEl.textContent = completedTasks;

  completeBtn.addEventListener('click', () => {
    completedTasks += 1;
    counterEl.textContent = completedTasks;
  });
}

// 1.2. Мобильное меню
const burgerBtn = document.querySelector('#burger-btn');
const navList = document.querySelector('#nav-list');

if (burgerBtn && navList) {
  burgerBtn.addEventListener('click', () => {
    navList.classList.toggle('nav-list--open');
  });
}

// 1.3. Модальное окно (закрывается по «×», клику по фону и Esc)
const modal = document.querySelector('#modal');
const openModalBtn = document.querySelector('#open-modal');

if (modal && openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    modal.classList.add('modal--open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close')) {
      modal.classList.remove('modal--open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('modal--open');
    }
  });
}

// =========================================================
// ЧАСТЬ 2. КЛИЕНТСКАЯ ВАЛИДАЦИЯ ФОРМЫ (ЛР № 6)
// =========================================================

const form = document.querySelector('#signup');

function validate(input) {
  const value = input.value.trim();

  if (input.required && value === '') {
    return 'Заполните обязательное поле';
  }
  if (value === '') {
    return '';
  }
  if (input.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
    return 'Неверный формат email (пример: user@mail.ru)';
  }
  if (input.name === 'name' && value.length < 2) {
    return 'Имя должно содержать минимум 2 символа';
  }
  return '';
}

function showError(input, message) {
  const field = input.closest('.field');
  if (!field) return;

  const errorEl = field.querySelector('.field__error');
  if (errorEl) {
    errorEl.textContent = message;
  }
  input.classList.toggle('field__input--invalid', message !== '');
}

if (form) {
  form.addEventListener('input', (e) => {
    if (e.target.matches('input')) {
      showError(e.target, validate(e.target));
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    for (const input of form.querySelectorAll('input')) {
      const msg = validate(input);
      showError(input, msg);
      if (msg) {
        isValid = false;
      }
    }

    const successEl = form.querySelector('.form__success');
    if (isValid) {
      form.reset();
      if (successEl) {
        successEl.textContent = 'Напоминания успешно подключены!';
      }
    } else if (successEl) {
      successEl.textContent = '';
    }
  });
}

// =========================================================
// ЧАСТЬ 3. ОТРИСОВКА СПИСКА, ПОИСК, СОРТИРОВКА И FETCH API
// =========================================================

let tasks = [];

const listEl = document.querySelector('.card-list');
const searchInput = document.querySelector('#search');
const categorySelect = document.querySelector('#category');
const sortSelect = document.querySelector('#sort');
const foundEl = document.querySelector('#found');
const statusEl = document.querySelector('#status');

function escapeHtml(s) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(s).replace(/[&<>"']/g, (c) => map[c]);
}

function renderList(items) {
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = '<p class="empty">Ничего не найдено</p>';
    return;
  }

  listEl.innerHTML = items.map((task) => `
    <article class="card task-card" data-id="${task.id}">
      <div class="card__header">
        <h3 class="card__title">${escapeHtml(task.title)}</h3>
        <button class="card__fav" type="button" title="Отметить как важную">☆</button>
      </div>
      <div>
        <div class="card__badges">
          <span class="card__badge">${escapeHtml(task.categoryLabel)}</span>
          <span class="card__badge card__badge--priority">${escapeHtml(task.priorityLabel)}</span>
        </div>
        <p class="card__meta">Дедлайн: ${escapeHtml(task.deadline)}</p>
        <p class="card__meta">Напоминание: ${escapeHtml(task.reminder)}</p>
      </div>
    </article>
  `).join('');
}

// Делегирование событий на списке карточек
if (listEl) {
  listEl.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.card__fav');
    if (!favBtn) return;

    const isActive = favBtn.classList.toggle('card__fav--active');
    favBtn.textContent = isActive ? '★' : '☆';
  });
}

// Функции сортировки для выпадающего списка
const sorters = {
  'priority-desc': (a, b) => b.priority - a.priority,
  'deadline-asc': (a, b) => a.deadline.localeCompare(b.deadline),
  'title': (a, b) => a.title.localeCompare(b.title, 'ru')
};

// Единая функция поиска, фильтрации и сортировки (не мутирует исходный массив tasks)
function applyFilters() {
  if (!searchInput || !categorySelect || !sortSelect || !foundEl) return;

  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;

  const items = tasks.filter((task) =>
    task.title.toLowerCase().includes(query) &&
    (selectedCategory === 'all' || task.category === selectedCategory)
  );

  const compare = sorters[sortSelect.value];
  if (compare) {
    items.sort(compare);
  }

  foundEl.textContent = `Найдено: ${items.length}`;
  renderList(items);
}

if (searchInput && categorySelect && sortSelect) {
  searchInput.addEventListener('input', applyFilters);
  categorySelect.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
}

// Управление статусами загрузки и ошибки
function setStatus(type, html) {
  if (!statusEl) return;
  statusEl.className = `status status--${type}`;
  statusEl.innerHTML = html;
}

// Асинхронная инициализация страницы через api.js
async function init() {
  setStatus('loading', 'Загрузка списка задач…');
  if (listEl) {
    listEl.innerHTML = '';
  }

  try {
    tasks = await getTasks();
    setStatus('ok', '');
    applyFilters();
  } catch (err) {
    console.error(err);
    setStatus(
      'error',
      '<span>Не удалось загрузить список задач. Проверьте файл data/tasks.json.</span>' +
      '<button class="btn btn-primary" id="retry" type="button">Повторить</button>'
    );

    const retryBtn = document.querySelector('#retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', init);
 // =========================================================
// СТРАНИЦА ЗАДАЧ (tasks.html): ЗАГРУЗКА И СОЗДАНИЕ ЧЕРЕЗ API
// =========================================================

const createTaskForm = document.querySelector('#create-task-form');
const tasksPageList = document.querySelector('#tasks-page-list');
const taskFormError = document.querySelector('#task-form-error');

async function loadTasksPage() {
  if (!tasksPageList) return;

  try {
    const items = await getTasks();
    if (items.length === 0) {
      tasksPageList.innerHTML = '<li>Задач пока нет</li>';
      return;
    }

    tasksPageList.innerHTML = items.map((t) => `
      <li>
        <strong>${escapeHtml(t.title)}</strong> — ${escapeHtml(t.categoryLabel)}
        (${escapeHtml(t.priorityLabel)}, до ${escapeHtml(t.deadline)})
      </li>
    `).join('');
  } catch (err) {
    console.error(err);
    tasksPageList.innerHTML = '<li>Не удалось загрузить задачи с сервера</li>';
  }
}

if (createTaskForm) {
  loadTasksPage();

  createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (taskFormError) taskFormError.textContent = '';

    const newTask = {
      title: document.querySelector('#new-task-title').value,
      deadline: document.querySelector('#new-task-deadline').value,
      category: document.querySelector('#new-task-category').value,
      priority: Number(document.querySelector('#new-task-priority').value)
    };

    try {
      await createTask(newTask);
      createTaskForm.reset();
      await loadTasksPage();
    } catch (err) {
      if (taskFormError) {
        taskFormError.textContent = err.message;
      }
    }
  });
}

init();