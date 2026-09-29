// e2e/tasks.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Taskflow API - End-to-End Suite', () => {

  // Action 1: list tasks
  test('Action 1: list tasks should return status 200 and task array', async ({ request }) => {
    const response = await request.get('/tasks');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  // Action 2: create task
  test('Action 2: create task should add a new task', async ({ request }) => {
    const response = await request.post('/tasks', {
      data: { title: 'Playwright Automated E2E Task' }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.title).toBe('Playwright Automated E2E Task');
    expect(data.completed).toBe(false);
  });

  // Action 3: mark task done
  test('Action 3: mark task done should update completed to true', async ({ request }) => {
    const response = await request.patch('/tasks/1');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(1);
    expect(data.completed).toBe(true);
  });

});
