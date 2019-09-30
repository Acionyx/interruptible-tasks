"use strict";

import {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError,
  TaskHasBeenCancelledError,
  TaskHasBeenInterruptedError
} from "../src";

test("task non cancelability", async () => {
  expect.assertions(2);

  const nonInterruptibleTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 10));
    },
    { interruptible: false, cancelable: false, name: "nonInterruptibleTask" }
  );

  nonInterruptibleTask.run();
  try {
    nonInterruptibleTask.cancel();
  } catch (e) {
    expect(e).toEqual(
      new NotCancelableError("Task nonInterruptibleTask is not cancelable")
    );
  }

  const interruptibleTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 10));
    },
    { interruptible: true, cancelable: false, name: "interruptibleTask" }
  );

  interruptibleTask.run();
  try {
    interruptibleTask.cancel();
  } catch (e) {
    expect(e).toEqual(
      new NotCancelableError("Task interruptibleTask is not cancelable")
    );
  }
});

test("task cancelability", async () => {
  expect.assertions(4);

  const nonInterruptibleTask = createTask(
    function*(data) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield data;
    },
    { interruptible: false, cancelable: true, name: "nonInterruptibleTask" }
  );

  const runPromise1 = nonInterruptibleTask.run();
  expect(nonInterruptibleTask.cancel()).toBe(true);
  await expect(runPromise1).rejects.toEqual(
    new TaskHasBeenCancelledError(
      "Task nonInterruptibleTask has been cancelled"
    )
  );

  const interruptibleTask = createTask(
    function*(data) {
      yield new Promise(resolve => setTimeout(resolve, 10));
      yield data;
    },
    { interruptible: true, cancelable: true, name: "interruptibleTask" }
  );

  const runPromise2 = interruptibleTask.run();
  expect(interruptibleTask.cancel()).toBe(true);
  await expect(runPromise2).rejects.toEqual(
    new TaskHasBeenCancelledError("Task interruptibleTask has been cancelled")
  );
});
