export const statuses = Object.freeze({
  running: Symbol(),
  stopped: Symbol()
});

export function makeInterruptible(
  generator,
  params = { abortable: true, name: Symbol() },
  connect = null
) {
  let globalNonce;
  let currentStatus = statuses.stopped;

  const setRunning = () => {
    currentStatus = statuses.running;
    connect &&
      connect(
        params.name,
        statuses.running
      );
  };

  const setStopped = () => {
    currentStatus = statuses.stopped;
    connect &&
      connect(
        params.name,
        statuses.stopped
      );
  };

  return async function(...args) {
    if (currentStatus === statuses.running && !params.abortable) {
      throw new Error("Function is being executed already");
    }
    setRunning();
    const localNonce = (globalNonce = {});

    const iter = generator(...args);
    let resumeValue;
    for (;;) {
      let n;
      try {
        n = iter.next(resumeValue);
      } catch (e) {
        setStopped();
        throw e;
      }
      if (n.done) {
        setStopped();
        return n.value;
      }

      if (n.value instanceof Promise) {
        try {
          resumeValue = await n.value;
        } catch (e) {
          setStopped();
          throw e;
        }
      }
      if (localNonce !== globalNonce && params.abortable) {
        return; // a new call was made
      }
      // next loop, we give resumeValue back to the generator
    }
  };
}
