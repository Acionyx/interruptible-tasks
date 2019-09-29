"use strict";

const library = require("../dist");

const {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError
} = library;

const wiredAction = (name, status) => {
  console.log(
    "saved in state",
    name,
    status === taskStatuses.stopped ? "stopped" : "running"
  );
};

test("API exists", () => {
  expect(typeof createTask).toBe("function");
  expect(typeof taskStatuses).toBe("object");
  expect(typeof NotCancelableError).toBe("function");
  expect(typeof NotInterruptibleError).toBe("function");
});

test("createTask execution", () => {
  const task = createTask(
    function*() {},
    { interruptible: true, cancelable: true, name: "testTask" },
    wiredAction
  );
  expect(typeof task).toBe("object");
  expect(typeof task.run).toBe("function");
  expect(typeof task.cancel).toBe("function");
});

test("task non interruptibility", async () => {
  expect.assertions(2);

  const nonCancelableTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 1000));
    },
    { interruptible: false, cancelable: false, name: "nonCancelableTask" }
  );

  nonCancelableTask.run();
  await expect(nonCancelableTask.run()).rejects.toEqual(
    new NotInterruptibleError(
      "Task nonCancelableTask is being executed already"
    )
  );

  const cancelableTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 1000));
    },
    { interruptible: false, cancelable: true, name: "cancelableTask" }
  );

  cancelableTask.run();
  await expect(cancelableTask.run()).rejects.toEqual(
    new NotInterruptibleError("Task cancelableTask is being executed already")
  );
});

test("task non cancelability", async () => {
  expect.assertions(2);

  const nonInterruptibleTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 1000));
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
      yield new Promise(resolve => setTimeout(resolve, 1000));
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
