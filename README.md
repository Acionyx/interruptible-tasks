[![Build Status](https://img.shields.io/npm/v/interruptible-tasks)](http://npmjs.com/package/interruptible-tasks)
[![Build Status](https://travis-ci.com/Acionyx/interruptible-tasks.svg?token=EeHNf4zTWPNyX4W8qBTN&branch=master)](https://travis-ci.com/Acionyx/interruptible-tasks)
[![Coverage Status](https://coveralls.io/repos/github/Acionyx/interruptible-tasks/badge.svg?branch=master)](https://coveralls.io/github/Acionyx/interruptible-tasks?branch=master)

# Interruptible-tasks

Interruptible Tasks is a JavaScript library for creating manageable,
interruptible and cancelable async functions - **Tasks**.

## The Why

This library was created in order to manage complex async flow without pain.

If you have to know execution status of some async function,
usually you will finish up with adding manual "status" updates inside of function.
If your function could throw exception during it's execution,
you need to take care about it too.

Once you needed ability to cancel or interrupt function you'll have to add more and more code
into each place and take care of errors handling too.

Interruptible Tasks library makes you free of that routine and provides some extra features described below.

## Features

- Tasks could be cancelable, interruptible and vice-versa (details below)
- Tasks could be nested
- Tasks status changes (pending/stopped) could be easily connected to any state library (redux/vuex/hyperapp/custom
  /etc)
- Clear errors handling and custom error types for granular control over your code
- Heavily tested
- ES5/ES3 support - goes bundled as CommonJS, ES6 module and IIFE

You could adopt your existing code step-by-step, without any huge refactoring.

## Getting Started

### Installing

```shell script
yarn add interruptible-tasks
// or
npm install interruptible-tasks
```

## Using

### Basic usage

Here is example of very basic usage. API in details is described below.

```javascript
import { createTask } from 'interruptible-tasks';

const demoFunction = function*(value) {
  yield new Promise(resolve => setTimeout(() => resolve(value), 1000));
};
const task = createTask(demoFunction);

task.run('Here we go!'); // resolves with "Here we go!" after 1 second
```

### API

#### createTask

##### Parameters

**`generator`** - **required** - your generator function to be converted to Task.

If you are modifying existing code, then you have to change type of your function from async
to generator and replace all `await` statements with `yield`.

Example:

```js
// before
const demoFunction = async function(value) {
  await new Promise(resolve => setTimeout(() => resolve(value), 1000));
};
// after
const demoFunction = function*(value) {
  yield new Promise(resolve => setTimeout(() => resolve(value), 1000));
};
```

**`params`** - **optional** - object with parameters for your Task.

Defaults:

```json
{
  "interruptible": false,
  "cancelable": true,
  "name": Symbol("Unnamed task")
}
```

You can redefine any of those parameters. Explanation:

`interruptible` - can your running Task be interrupted by new `.run()` call or not. **Interrupting** means that
currently running Task will reject its promise when next `yield` statement inside `generator` function is reached.

Example:

```js
const task = createTask(
  function*(data) {
    yield new Promise(resolve => setTimeout(resolve, 10));
    yield data;
  },
  { interruptible: true, cancelable: false, name: 'demoTask' }
);

task.run('not ok').catch(console.error); // after 10ms: TaskHasBeenInterruptedError('Task demoTask has been interrupted')

const result = await task.run('ok'); // after 10ms: 'ok'
```

If `interruptible: false` is passed, second `.run('ok')` call will be rejected immediately with `NotInterruptibleError`, while first `.call('not ok')` will be resolved normally.

`cancelable` - can your running Task be cancelled by `.cancel()` call or not. **Cancelable** means that
currently running Task will reject its promise when next `yield` statement inside `generator` function is reached.

Example:

```js
const task = createTask(
  function*(data) {
    yield new Promise(resolve => setTimeout(resolve, 10));
    yield data;
  },
  { interruptible: false, cancelable: true, name: 'demoTask' }
);

task.run().catch(console.error); // after 10ms: TaskHasBeenCancelledError('Task demoTask has been cancelled')
task.cancel(); // true
```

If `cancelable: false` is passed, `.cancel()` call will be rejected immediately with `NotCancelableError`.

`name` - name of your task to be passed to `connect` function. If you do not provide `name`, default name will be
used. It does not affect any other behaviour. `name` could be of any data type.

**`connect`** - **optional** - function to be used for passing Task status updates (pending/stopped).

Example:

```js
import { createTask, taskStatuses } from 'interruptible-tasks';
const taskName = 'connectedTask';
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

let runPromise = task.run('some data');
console.log(stateImitation.get(taskName) === taskStatuses.pending); // === true;
await runPromise;
console.log(stateImitation.get(taskName) === taskStatuses.stopped); // === true;
```

##### Returns

`createTask` function returns an object (Task) containing two properties: `run` and `cancel` functions.

##### Task.run and Task.cancel

`run` function returns a Promise.
It will be resolved with value returned by `generator` function once it is finished.
It will be rejected with custom error if Task is interrupted or cancelled.
It will be rejected if any other error occurs inside `generator` function.

`cancel` function return `true` if Task could and will be cancelled, otherwise it will throw a custom error.

#### Errors

There are four custom errors exported:

`NotInterruptibleError` is being threw when `.run()` is called on non-interruptible Task.

`NotCancelableError` is being threw when `.cancel()` is called on non-cancelable Task.

`TaskHasBeenInterruptedError` is being threw when already ran Task is interrupted by `.run()`.

`TaskHasBeenCancelledError` is being threw when Task is cancelled by `.cancel()`.

#### Task statuses

Task could be in one of two statuses: `pending` or `stopped`. Statuses are presented as Symbols, so object `taskStatuses` needs to be imported to understand current status of your Task.

Example:

```js
import { taskStatuses } from 'interruptible-tasks';

console.log(taskStatuses);
/*
{
  pending: Symbol('pending'),
  stopped: Symbol('stopped')
}
*/
```

Usage example could be found above inside of `connect` description.

### Nesting

Tasks could be nested, in that case cancellation and interruption calls will bubble down to every nested Task.
If any of nested Tasks is rejected by any reason, parent Task will receive corresponding error.
Cancellation or interruption of nested Task does not affect parent Task if it happened on nested Task only.

Examples are available in `__tests__` folder at GitHub repo.

### Using specific build

Library goes with four builds bundled, default build is CommonJS module with code transpiled to ES5.
If you need to use another build, you could specify it in `import`:

```js
import {} from 'interruptible-tasks'; // CommonJS, ES5
import {} from 'interruptible-tasks/index.es5.es.js'; // ES module, ES5
import {} from 'interruptible-tasks/index.es5.iife.js'; // IIFE, ES5
import {} from 'interruptible-tasks/index.es3.cjs.js'; // CommonJS, ES3
```

## More examples

There are a lot of good examples in tests, you can find them at GitHub repo in `__tests__` folder.

## Authors

- **Vladislav Bogomaz** - [Github](https://github.com/Acionyx)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
