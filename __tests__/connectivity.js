"use strict";

import {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError,
  TaskHasBeenCancelledError,
  TaskHasBeenInterruptedError
} from "../src";

test("task status connectivity", async () => {
  expect.assertions(7);

  const taskName = "connectedTask";
  const stateImitation = new Map();

  const connect = (name, status) => {
    stateImitation.set(name, status);
  };

  const task = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 10));
    },
    { interruptible: false, cancelable: false, name: taskName },
    connect
  );

  expect(stateImitation.has(taskName)).toBe(false);

  let runPromise = task.run("some data");
  expect(stateImitation.get(taskName) === taskStatuses.pending).toBe(true);
  await runPromise;
  expect(stateImitation.get(taskName) === taskStatuses.stopped).toBe(true);

  runPromise = task.run("another data");
  expect(stateImitation.get(taskName) === taskStatuses.pending).toBe(true);
  await runPromise;
  expect(stateImitation.get(taskName) === taskStatuses.stopped).toBe(true);

  runPromise = task.run("final data");
  expect(stateImitation.get(taskName) === taskStatuses.pending).toBe(true);
  await runPromise;
  expect(stateImitation.get(taskName) === taskStatuses.stopped).toBe(true);
});
