// tests/app.test.js
const { app, processTaskTitle, getTaskStatus } = require('../index');

describe('Taskflow Unit Tests (High Coverage)', () => {
  test('processTaskTitle trims valid string', () => {
    expect(processTaskTitle('  Learn CI/CD  ')).toBe('Learn CI/CD');
  });

  test('processTaskTitle handles empty or falsy values', () => {
    expect(processTaskTitle('')).toBe('UNTITLED');
    expect(processTaskTitle(null)).toBe('UNTITLED');
  });

  test('getTaskStatus returns DONE when true', () => {
    expect(getTaskStatus(true)).toBe('DONE');
  });

  test('getTaskStatus returns PENDING when false', () => {
    expect(getTaskStatus(false)).toBe('PENDING');
  });

  // ทดสอบ Route Handlers เพิ่มเติมเพื่อให้ Code Coverage บน index.js เกิน 85%-90% ตามเป้าหมาย Quality Gate
  test('GET /tasks returns list of tasks', () => {
    const route = app._router.stack.find(s => s.route && s.route.path === '/tasks' && s.route.methods.get);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    route.route.stack[0].handle({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('POST /tasks creates a new task', () => {
    const route = app._router.stack.find(s => s.route && s.route.path === '/tasks' && s.route.methods.post);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    route.route.stack[0].handle({ body: { title: 'Unit Test Task' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('PATCH /tasks/:id marks task as done or returns 404', () => {
    const route = app._router.stack.find(s => s.route && s.route.path === '/tasks/:id' && s.route.methods.patch);
    const resSuccess = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    route.route.stack[0].handle({ params: { id: '1' } }, resSuccess);
    expect(resSuccess.status).toHaveBeenCalledWith(200);

    const resNotFound = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    route.route.stack[0].handle({ params: { id: '9999' } }, resNotFound);
    expect(resNotFound.status).toHaveBeenCalledWith(404);
  });
});
