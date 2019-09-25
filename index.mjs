import { makeInterruptible, statuses } from "./interruptible.mjs";

const wiredAction = (name, status) => {
  console.log("saved in state", name, status === statuses.stopped ? 'stopped' : 'running');
};

function* stepFunctionInner(str) {
  console.log("00", str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(11, str, new Date().getTime());

  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(33, str, new Date().getTime());
}

function* stepFunction(str) {
  console.log(0, str, new Date().getTime());
  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(1, str, new Date().getTime());

  // throw new Error("test error");

  yield fInner(str);

  // yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(3, str, new Date().getTime());

  yield new Promise(resolve => setTimeout(resolve, 1000));
  console.log(5, str, new Date().getTime());
}

const f = makeInterruptible(stepFunction, { interruptible: true, name: 'globalProcess' }, wiredAction);
const fInner = makeInterruptible(stepFunctionInner, { interruptible: true, name: 'innerProcess' }, wiredAction);

f("test1");
setTimeout(() => f("test3").catch(console.error), 1500);
