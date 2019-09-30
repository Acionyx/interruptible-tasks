"use strict";

const library = require("../src");

const {
  createTask,
  taskStatuses,
  NotCancelableError,
  NotInterruptibleError,
  TaskHasBeenCancelledError,
  TaskHasBeenInterruptedError
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

test("task non interruptibility", async () => {
  expect.assertions(2);

  const nonCancelableTask = createTask(
    function*() {
      yield new Promise(resolve => setTimeout(resolve, 200));
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
      yield new Promise(resolve => setTimeout(resolve, 200));
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
      yield new Promise(resolve => setTimeout(resolve, 200));
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
      yield new Promise(resolve => setTimeout(resolve, 200));
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

test("task interruptibility", async () => {
  expect.assertions(4);

  const nonCancelableTask = createTask(
    function*(data) {
      yield new Promise(resolve => setTimeout(resolve, 200));
      yield data;
    },
    { interruptible: true, cancelable: false, name: "nonCancelableTask" }
  );

  nonCancelableTask.run("not ok").catch(e => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        "Task nonCancelableTask has been interrupted"
      )
    );
  });
  await expect(nonCancelableTask.run("ok")).resolves.toEqual("ok");

  const cancelableTask = createTask(
    function*(data) {
      yield new Promise(resolve => setTimeout(resolve, 200));
      yield data;
    },
    { interruptible: true, cancelable: true, name: "cancelableTask" }
  );

  cancelableTask.run("not ok").catch(e => {
    expect(e).toEqual(
      new TaskHasBeenInterruptedError(
        "Task cancelableTask has been interrupted"
      )
    );
  });
  await expect(cancelableTask.run("ok")).resolves.toEqual("ok");
});

test("task cancelability", async () => {
  expect.assertions(4);

  const nonInterruptibleTask = createTask(
    function*(data) {
      yield new Promise(resolve => setTimeout(resolve, 200));
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
      yield new Promise(resolve => setTimeout(resolve, 200));
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
