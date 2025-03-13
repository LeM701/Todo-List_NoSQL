// Import Firebase database credentials from firebase-config.js and Firebase modules
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// Initialization
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const tasksRef = ref(db, 'tasks');

// DOM Elements
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const themeToggleBtn = document.getElementById("theme-toggle");

// States
let isSubmitting = false;

// Basic Functions
const clearElement = (element) => {
  while (element.firstChild) element.removeChild(element.firstChild);
};

const createTaskElement = (taskData, taskId) => {
  const li = document.createElement("li");
  li.className = "task-item";

  const taskNameSpan = document.createElement("span");
  taskNameSpan.className = "task-name";
  taskNameSpan.textContent = taskData.name;

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn-edit";
  btnEdit.textContent = "Modifier";

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn-delete";
  btnDelete.textContent = "Supprimer";

  const taskActionsDiv = document.createElement("div");
  taskActionsDiv.className = "task-actions";
  taskActionsDiv.appendChild(btnEdit);
  taskActionsDiv.appendChild(btnDelete);

  li.appendChild(taskNameSpan);
  li.appendChild(taskActionsDiv);

  // Event Handlers
  btnEdit.addEventListener("click", () => {
    const newName = prompt("Modifier la tâche :", taskData.name);
    if (newName?.trim()) {
      update(ref(db, `tasks/${taskId}`), { name: newName.trim() });
    }
  });

  btnDelete.addEventListener("click", () => {
    if (confirm("Supprimer cette tâche ?")) {
      remove(ref(db, `tasks/${taskId}`));
    }
  });

  return li;
};

// Data Listening
onValue(tasksRef, (snapshot) => {
  clearElement(taskList);
  const tasks = snapshot.val() || {};

  if (Object.keys(tasks).length === 0) {
    const emptyStateLi = document.createElement("li");
    emptyStateLi.className = "empty-state";
    emptyStateLi.textContent = "🎉 Aucune tâche à afficher !";
    
    const small = document.createElement("small");
    small.textContent = "Commencez par ajouter une tâche ci-dessus";
    emptyStateLi.appendChild(small);
    
    taskList.appendChild(emptyStateLi);
    return;
  }

  Object.entries(tasks).forEach(([taskId, taskData]) => {
    taskList.appendChild(createTaskElement(taskData, taskId));
  });
});

// Form Management
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const taskName = taskInput.value.trim();
  if (!taskName) return;

  isSubmitting = true;
  const submitBtn = taskForm.querySelector("button");
  const originalContent = submitBtn.textContent;

  try {
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    submitBtn.textContent = "";
    submitBtn.appendChild(spinner);

    await push(tasksRef, {
      name: taskName,
      createdAt: new Date().toISOString()
    });
    
    taskInput.value = "";
  } catch (error) {
    const alert = document.createElement("div");
    alert.className = "error-alert";
    alert.textContent = `Erreur : ${error.message}`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  } finally {
    isSubmitting = false;
    submitBtn.textContent = originalContent;
  }
});

// Theme Management
const updateTheme = (isDark) => {
  document.body.classList.toggle("dark-mode", isDark);
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
};

themeToggleBtn.addEventListener("click", () => {
  updateTheme(!document.body.classList.contains("dark-mode"));
});

// Initialization on Load
document.addEventListener("DOMContentLoaded", () => {
  updateTheme(localStorage.getItem("darkMode") === "enabled");
});

// Real-time Validation
taskInput.addEventListener("input", () => {
  const value = taskInput.value.trim();
  let error = "";

  if (value.length > 100) error = "Maximum 100 caractères";
  if (/[<>{}()$*^]/.test(value)) error = "Caractères spéciaux interdits";
  taskInput.setCustomValidity(error);
  taskInput.style.borderColor = error ? "#dc3545" : "";
});