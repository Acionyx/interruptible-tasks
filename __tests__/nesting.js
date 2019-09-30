"use strict";

import {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError,
  TaskHasBeenCancelledError,
  TaskHasBeenInterruptedError
} from "../src";

test("nested task returns value", async () => {
  expect.assertions(1);

  const finalValue = 123;

  const thirdLevelTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(() => resolve(finalValue), 0));
    },
    { interruptible: false, cancelable: false, name: "thirdLevelTask" }
  );

  const secondLevelTask = createTask(
    function*() {
      yield thirdLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: "secondLevelTask" }
  );

  const firstLevelTask = createTask(
    function*() {
      yield secondLevelTask.run();
    },
    { interruptible: false, cancelable: false, name: "firstLevelTask" }
  );

  await expect(firstLevelTask.run()).resolves.toBe(finalValue);
});
