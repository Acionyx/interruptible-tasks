'use strict';

import { createTask, TaskHasBeenCancelledError } from '../src';

test('nested tasks cancels correctly', async () => {
  expect.assertions(1);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: false, cancelable: true, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield thirdLevelTask.run(value);
    },
    { interruptible: false, cancelable: true, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value);
    },
    { interruptible: false, cancelable: true, name: 'firstLevelTask' }
  );

  const runPromise = firstLevelTask.run().catch(e => {
    expect(e).toEqual(
      new TaskHasBeenCancelledError('Task firstLevelTask has been cancelled')
    );
  });

  firstLevelTask.cancel();
  await runPromise;
});

test('nested tasks cancels correctly with inner catch', async () => {
  expect.assertions(2);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: false, cancelable: true, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield thirdLevelTask.run(value);
    },
    { interruptible: false, cancelable: true, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value).catch(e => {
        expect(e).toEqual(
          new TaskHasBeenCancelledError(
            'Task secondLevelTask has been cancelled'
          )
        );
      });
      yield value;
    },
    { interruptible: false, cancelable: true, name: 'firstLevelTask' }
  );

  const value = 'value';
  const runPromise = firstLevelTask.run(value);
  secondLevelTask.cancel();
  await expect(runPromise).resolves.toBe(value);
});

test('nested task cancels correctly without inner catch', async () => {
  expect.assertions(1);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: false, cancelable: true, name: 'thirdLevelTask' }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield thirdLevelTask.run(value);
    },
    { interruptible: false, cancelable: true, name: 'secondLevelTask' }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value);
      yield value;
    },
    { interruptible: false, cancelable: true, name: 'firstLevelTask' }
  );

  const value = 'value';
  const runPromise = firstLevelTask.run(value).catch(e => {
    expect(e).toEqual(
      new TaskHasBeenCancelledError('Task secondLevelTask has been cancelled')
    );
  });
  secondLevelTask.cancel();
  await runPromise;
});
