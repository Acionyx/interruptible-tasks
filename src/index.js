"use strict";

const debug = () => {};

export const taskStatuses = Object.freeze({
  pending: Symbol("pending"),
  stopped: Symbol("stopped")
});

export class NotInterruptibleError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotInterruptibleError);
    }

    this.name = "NotInterruptibleError";
  }
}

export class NotCancelableError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotCancelableError);
    }

    this.name = "NotCancelableError";
  }
}

export class TaskHasBeenCancelledError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TaskHasBeenCancelledError);
    }

    this.name = "TaskHasBeenCancelledError";
  }
}

export class TaskHasBeenInterruptedError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TaskHasBeenInterruptedError);
    }

    this.name = "TaskHasBeenInterruptedError";
  }
}

const cancelMarker = Symbol("InterruptibleTaskMarker");

export const createTask = (
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
    debug(`CANCEL has been called for ${params.name}`);
    if (
      currentNext.value instanceof Promise &&
      typeof currentNext.value[cancelMarker] === "function"
    ) {
      return currentNext.value[cancelMarker]();
    }
    return true;
  };

  const run = function(...args) {
    debug(`RUN has been called for ${params.name}`);
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
          resolve(resumeValue);
          return resumeValue;
        }

        if (currentNext.value instanceof Promise) {
          if (typeof currentNext.value[cancelMarker] === "function") {
            debug(`Nested Task has been detected in ${params.name}`);
          }
          try {
            resumeValue = await currentNext.value;
          } catch (e) {
            setStopped();
            if (typeof currentNext.value[cancelMarker] === "function") {
              if (
                localNonce !== globalNonce &&
                e instanceof TaskHasBeenInterruptedError
              ) {
                reject(
                  new TaskHasBeenInterruptedError(
                    `Task ${params.name} has been interrupted`
                  )
                );
              } else if (
                forceCancel &&
                e instanceof TaskHasBeenCancelledError
              ) {
                reject(
                  new TaskHasBeenCancelledError(
                    `Task ${params.name} has been cancelled`
                  )
                );
              }
            }
            reject(e);
            return;
          }
        } else {
          resumeValue = currentNext.value;
        }
        if (localNonce !== globalNonce || forceCancel) {
          setStopped();
          if (forceCancel) {
            reject(
              new TaskHasBeenCancelledError(
                `Task ${params.name} has been cancelled`
              )
            );
          } else {
            reject(
              new TaskHasBeenInterruptedError(
                `Task ${params.name} has been interrupted`
              )
            );
          }
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

  debug(`Task has been created with name ${params.name}`);
  return {
    run,
    cancel
  };
};
