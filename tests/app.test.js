// tests/app.test.js
function sum(a, b) {
  return a + b;
}

function getTaskStatus(isCompleted) {
  if (isCompleted) {
    return 'DONE';
  }
  return 'PENDING';
}

describe('Taskflow Core Unit Tests', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  test('checks task status done', () => {
    expect(getTaskStatus(true)).toBe('DONE');
  });

  test('checks task status pending', () => {
    expect(getTaskStatus(false)).toBe('PENDING');
  });
});
