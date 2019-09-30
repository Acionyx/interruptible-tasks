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
  expect.assertions(2);

  const thirdLevelTask = createTask(
    function*(value) {
      yield new Promise(resolve => setTimeout(() => resolve(value), 10));
    },
    { interruptible: true, cancelable: false, name: "thirdLevelTask" }
  );

  const secondLevelTask = createTask(
    function*(value) {
      yield thirdLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: "secondLevelTask" }
  );

  const firstLevelTask = createTask(
    function*(value) {
      yield secondLevelTask.run(value);
    },
    { interruptible: true, cancelable: false, name: "firstLevelTask" }
  );

  const runPromise = firstLevelTask.run().catch(e => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        "Task firstLevelTask has been interrupted"
      )
    );
  });

  const value = "value";
  await expect(firstLevelTask.run(value)).resolves.toBe(value);
});
