const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/${path}`, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

async function getTasks() {
  return request('tasks');
}

async function getTask(id) {
  return request(`tasks/${id}`);
}

async function createTask(taskData) {
  return request('tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
}

async function deleteTask(id) {
  return request(`tasks/${id}`, {
    method: 'DELETE'
  });
}