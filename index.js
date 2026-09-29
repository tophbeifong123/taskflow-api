const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('OK'));
app.listen(8080, () => console.log('Running on 8080'));
// [Technical Justification - 20 Points]:

// ฟังก์ชันจำลองที่ไม่มี Unit Test เพื่อดึง Coverage ให้ต่ำกว่า 70%
function processTaskBatch(tasks) {
  if (!tasks || tasks.length === 0) return [];
  return tasks.map(task => {
    return {
      id: task.id,
      title: task.title.toUpperCase(),
      status: task.completed ? 'DONE' : 'IN_PROGRESS',
      updatedAt: new Date().toISOString()
    };
  });
}

function calculateProductivityScore(completedTasks, totalTasks) {
  if (totalTasks === 0) return 0;
  const ratio = completedTasks / totalTasks;
  if (ratio >= 0.8) return 'EXCELLENT';
  if (ratio >= 0.5) return 'GOOD';
  return 'NEEDS_IMPROVEMENT';
}