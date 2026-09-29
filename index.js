// index.js
const express = require('express');
const app = express();
app.use(express.json());

let tasks = [
  { id: 1, title: 'Initial Task', completed: false }
];

// Helper functions (ใช้คำนวณและทำ Unit Test)
function processTaskTitle(title) {
  if (!title) return 'UNTITLED';
  return title.trim();
}

function getTaskStatus(isCompleted) {
  return isCompleted ? 'DONE' : 'PENDING';
}

// 1. Action: list tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// 2. Action: create task
app.post('/tasks', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: processTaskTitle(req.body.title),
    completed: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// 3. Action: mark task done
app.patch('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  task.completed = true;
  res.status(200).json(task);
});

// Start server เมื่อรันแบบ standalone
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Taskflow API server running on port ${PORT}`);
  });
}

module.exports = { app, processTaskTitle, getTaskStatus };