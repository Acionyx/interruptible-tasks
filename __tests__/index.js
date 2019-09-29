"use strict";

const library = require("../dist");

const { createTask, taskStatuses } = library;

const wiredAction = (name, status) => {
  console.log(
    "saved in state",
    name,
    status === taskStatuses.stopped ? "stopped" : "running"
  );
};

function* stepFunctionInner(str) {
  console.log(11, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));

  console.log(22, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));

  console.log(33, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));

  console.log(44, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));

  console.log(55, str, new Date().getTime());
}

function* stepFunction(str) {
  console.log(1, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));
  // throw new Error('boom');
  yield fInner.run(str);

  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(2, str, new Date().getTime());
}

const f = createTask(
  stepFunction,
  { interruptible: false, cancelable: true, name: "globalProcess" },
  wiredAction
);
const fInner = createTask(
  stepFunctionInner,
  { interruptible: false, cancelable: false, name: "innerProcess" },
  wiredAction
);

// f.run("test1").catch(console.error);
// // setTimeout(() => f.run("test3").catch(console.error), 1500);
// setTimeout(() => {
//   try {
//     f.cancel();
//   } catch (e) {
//     console.error(e);
//   }
// }, 2000);
//
//
//

test("API exists", () => {
  expect(typeof createTask).toBe("function");
  expect(typeof taskStatuses).toBe("object");
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
