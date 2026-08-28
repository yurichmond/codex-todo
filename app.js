"use strict";

const STORAGE_KEY = "todoTasks";

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const taskSummary = document.querySelector("#task-summary");
const filterControls = document.querySelector("#filter-controls");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(savedTasks)) {
      return [];
    }

    return savedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch (error) {
    console.warn("无法读取保存的任务，将使用空列表。", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("任务保存失败。", error);
  }
}

function createTaskId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function getEmptyStateMessage() {
  if (tasks.length === 0) {
    return "还没有任务，先添加一件想做的事吧。";
  }

  if (currentFilter === "active") {
    return "没有未完成的任务。";
  }

  return "还没有已完成的任务。";
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderTasks() {
  todoList.replaceChildren();
  updateFilterButtons();

  const visibleTasks = getVisibleTasks();
  const completedCount = tasks.filter((task) => task.completed).length;
  taskSummary.textContent =
    tasks.length === 0
      ? "0 个任务"
      : `${tasks.length} 个任务，已完成 ${completedCount} 个`;

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = getEmptyStateMessage();
    todoList.append(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleTasks.forEach((task) => {
    const listItem = document.createElement("li");
    listItem.className = `todo-item${task.completed ? " completed" : ""}`;
    listItem.dataset.id = task.id;

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "todo-toggle";
    toggleButton.dataset.action = "toggle";
    toggleButton.setAttribute(
      "aria-label",
      task.completed ? `将“${task.text}”标记为未完成` : `完成“${task.text}”`,
    );

    const taskText = document.createElement("span");
    taskText.className = "todo-text";
    taskText.dataset.action = "toggle";
    taskText.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "删除";
    deleteButton.setAttribute("aria-label", `删除“${task.text}”`);

    listItem.append(toggleButton, taskText, deleteButton);
    fragment.append(listItem);
  });

  todoList.append(fragment);
}

function addTask(text) {
  tasks.push({
    id: createTaskId(),
    text,
    completed: false,
  });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const taskText = todoInput.value.trim();
  if (!taskText) {
    todoInput.focus();
    return;
  }

  addTask(taskText);
  todoForm.reset();
  todoInput.focus();
});

todoList.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const listItem = event.target.closest(".todo-item");

  if (!actionTarget || !listItem) {
    return;
  }

  if (actionTarget.dataset.action === "toggle") {
    toggleTask(listItem.dataset.id);
  }

  if (actionTarget.dataset.action === "delete") {
    deleteTask(listItem.dataset.id);
  }
});

filterControls.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");

  if (!filterButton) {
    return;
  }

  currentFilter = filterButton.dataset.filter;
  renderTasks();
});

renderTasks();
