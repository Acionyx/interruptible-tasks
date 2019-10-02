'use strict';

import { createTask, TaskHasBeenInterruptedError } from '../src';

test('nested task returns value and interrupts correctly', async () => {
  expect.assertions(2);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: true, cancelable: false, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield thirdLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: 'firstLevelTask' }
  );

  firstLevelTask.run().catch(e => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        'Task firstLevelTask has been interrupted'
      )
    );
  });

  const value = 'value';
  await expect(firstLevelTask.run(value)).resolves.toBe(value);
});

test('nested task interrupts correctly with inner catch', async () => {
  expect.assertions(2);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: true, cancelable: false, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield thirdLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value).catch(e => {
        expect(e).toEqual(
          new TaskHasBeenInterruptedError(
            'Task secondLevelTask has been interrupted'
          )
        );
      });
      yield value;
    },
    { interruptible: true, cancelable: false, name: 'firstLevelTask' }
  );

  const value = 'value';
  const runPromise = firstLevelTask.run(value);
  secondLevelTask.run(value);
  await expect(runPromise).resolves.toBe(value);
});

test('nested task interrupts correctly without inner catch', async () => {
  expect.assertions(1);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: true, cancelable: false, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield thirdLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value);
      yield value;
    },
    { interruptible: true, cancelable: false, name: 'firstLevelTask' }
  );

  const value = 'value';
  firstLevelTask.run(value).catch(e => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        'Task secondLevelTask has been interrupted'
      )
    );
  });
  await secondLevelTask.run(value);
});
