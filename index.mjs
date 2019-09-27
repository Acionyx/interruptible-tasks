import { createTask, taskStatuses } from "./interruptible.mjs";

const wiredAction = (name, status) => {
  console.log("saved in state", name, status === taskStatuses.stopped ? 'stopped' : 'running');
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

  yield fInner.run(str);

  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(2, str, new Date().getTime());
}

const f = createTask(stepFunction, { interruptible: false, name: 'globalProcess' }, wiredAction);
const fInner = createTask(stepFunctionInner, { interruptible: false, name: 'innerProcess' }, wiredAction);

f.run("test1");
// setTimeout(() => fInner.run("test3").catch(console.error), 1500);
setTimeout(f.cancel, 2000);
