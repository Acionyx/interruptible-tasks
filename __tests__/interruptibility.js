'use strict';

import {
  createTask,
  NotInterruptibleError,
  TaskHasBeenInterruptedError,
} from '../src';

test('task non interruptibility', async () => {
  expect.assertions(2);

  const nonCancelableTask = createTask(
    function* () {
      yield new Promise((resolve) => setTimeout(resolve, 10));
    },
    { interruptible: false, cancelable: false, name: 'nonCancelableTask' }
  );

  nonCancelableTask.run();
  await expect(nonCancelableTask.run()).rejects.toEqual(
    new NotInterruptibleError(
      'Task nonCancelableTask is being executed already'
    )
  );

  const cancelableTask = createTask(
    function* () {
      yield new Promise((resolve) => setTimeout(resolve, 10));
    },
    { interruptible: false, cancelable: true, name: 'cancelableTask' }
  );

  cancelableTask.run();
  await expect(cancelableTask.run()).rejects.toEqual(
    new NotInterruptibleError('Task cancelableTask is being executed already')
  );
});

test('task interruptibility', async () => {
  expect.assertions(4);

  const nonCancelableTask = createTask(
    function* (data) {
      yield new Promise((resolve) => setTimeout(resolve, 10));
      yield data;
    },
    { interruptible: true, cancelable: false, name: 'nonCancelableTask' }
  );

  nonCancelableTask.run('not ok').catch((e) => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        'Task nonCancelableTask has been interrupted'
      )
    );
  });
  await expect(nonCancelableTask.run('ok')).resolves.toEqual('ok');

  const cancelableTask = createTask(
    function* (data) {
      yield new Promise((resolve) => setTimeout(resolve, 10));
      yield data;
    },
    { interruptible: true, cancelable: true, name: 'cancelableTask' }
  );

  cancelableTask.run('not ok').catch((e) => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        'Task cancelableTask has been interrupted'
      )
    );
  });
  await expect(cancelableTask.run('ok')).resolves.toEqual('ok');
});
