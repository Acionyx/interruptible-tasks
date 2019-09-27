export const taskStatuses = Object.freeze({
  pending: Symbol("pending"),
  stopped: Symbol("stopped")
});

export class NotInterruptibleError extends Error {
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

const cancelMarker = Symbol("InterruptibleTaskMarker");

export const createTask = (
  generator,
  params = { interruptible: true, cancelable: true, name: Symbol() },
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
    forceCancel = true;
    console.log("forced cancel for", params.name);
    if (
      currentNext.value instanceof Promise &&
      typeof currentNext.value[cancelMarker] === "function"
    ) {
      currentNext.value[cancelMarker]();
    }
  };

  const run = function(...args) {
    const runPromise = new Promise(async (resolve, reject) => {
      if (currentStatus === taskStatuses.pending && !params.interruptible) {
        throw new Error(`Task ${params.name} is being executed already`);
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
          throw e;
        }
        if (currentNext.done) {
          setStopped();
          resolve();
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
            throw e;
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
