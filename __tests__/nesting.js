'use strict';

import { createTask } from '../src';

test('nested task returns value', async () => {
  expect.assertions(1);

  const finalValue = 123;

  const thirdLevelTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(() => resolve(finalValue), 0));
    },
    { interruptible: false, cancelable: false, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*() {
      yield thirdLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*() {
      yield secondLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: 'firstLevelTask' }
  );

  await expect(firstLevelTask.run()).resolves.toBe(finalValue);
});

test('nested task handles exception', async () => {
  expect.assertions(1);

  const value = 'some error';

  const thirdLevelTask = createTask(
    function*() {
      throw new Error(value);
    },
    { interruptible: false, cancelable: false, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*() {
      yield thirdLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*() {
      yield secondLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: 'firstLevelTask' }
  );

  await expect(firstLevelTask.run()).rejects.toEqual(new Error(value));
});
