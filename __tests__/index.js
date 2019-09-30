"use strict";

import {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError,
  TaskHasBeenCancelledError,
  TaskHasBeenInterruptedError
} from "../src";

test("API exists", () => {
  expect(typeof createTask).toBe("function");
  expect(typeof taskStatuses).toBe("object");
  expect(typeof NotCancelableError).toBe("function");
  expect(typeof NotInterruptibleError).toBe("function");
});

test("createTask execution", () => {
  const task = createTask(function*() {}, {
    interruptible: true,
    cancelable: true,
    name: "testTask"
  });
  expect(typeof task).toBe("object");
  expect(typeof task.run).toBe("function");
  expect(typeof task.cancel).toBe("function");
});

test("task returns a value", async () => {
  expect.assertions(1);

  const value = "final value";
  const taskWithValue = createTask(
    function*() {
      yield value;
    },
    { interruptible: false, cancelable: false, name: "taskWithValue" }
  );

  return expect(taskWithValue.run()).resolves.toEqual(value);
});
