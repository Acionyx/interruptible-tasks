'use strict';

const taskStatuses = Object.freeze({
  pending: Symbol("pending"),
  stopped: Symbol("stopped")
});

class NotInterruptibleError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotInterruptibleError);
    }

    this.name = "NotInterruptibleError";
  }
}

class NotCancelableError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotCancelableError);
    }

    this.name = "NotCancelableError";
  }
}

const cancelMarker = Symbol("InterruptibleTaskMarker");

const createTask = (
  generator,
  params = {
    interruptible: false,
    cancelable: true,
    name: Symbol("Unnamed task")
  },
  connect = null
) => {
  let currentStatus = taskStatuses.stopped;

  const setPending = () => {
    currentStatus = taskStatuses.pending;
    connect &&
      connect(
        params.name,
        taskStatuses.pending
      );
  };

  const setStopped = () => {
    currentStatus = taskStatuses.stopped;
    connect &&
      connect(
        params.name,
        taskStatuses.stopped
      );
  };

  let currentNext;
  let globalNonce;
  let forceCancel = false;

  const cancel = () => {
    if (!params.cancelable) {
      throw new NotCancelableError(`Task ${params.name} is not cancelable`);
    }
    forceCancel = true;
    console.log("forced cancel for", params.name);
    if (
      currentNext.value instanceof Promise &&
      typeof currentNext.value[cancelMarker] === "function"
    ) {
      return currentNext.value[cancelMarker]();
    }
    return true;
  };

  const run = function(...args) {
    forceCancel = false;

    const runPromise = new Promise(async (resolve, reject) => {
      if (currentStatus === taskStatuses.pending && !params.interruptible) {
        reject(
          new NotInterruptibleError(
            `Task ${params.name} is being executed already`
          )
        );
        return;
      }
      setPending();
      let localNonce = (globalNonce = {});

      const iter = generator(...args);
      let resumeValue;

      for (;;) {
        try {
          currentNext = iter.next(resumeValue);
        } catch (e) {
          setStopped();
          reject(e);
          return;
        }
        if (currentNext.done) {
          setStopped();
          resolve(currentNext.value);
          return currentNext.value;
        }

        if (currentNext.value instanceof Promise) {
          if (typeof currentNext.value[cancelMarker] === "function") {
            console.log("detected nested task");
          }
          try {
            resumeValue = await currentNext.value;
          } catch (e) {
            setStopped();
            reject(e);
            return;
          }
        }
        if (localNonce !== globalNonce || forceCancel) {
          setStopped();
          resolve();
          return;
        }
      }
    });

    Object.defineProperty(runPromise, cancelMarker, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: cancel
    });

    return runPromise;
  };

  return {
    run,
    cancel
  };
};

module.exports = {
  taskStatuses,
  NotInterruptibleError,
  NotCancelableError,
  createTask
};
