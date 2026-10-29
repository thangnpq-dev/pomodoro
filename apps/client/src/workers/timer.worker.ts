// Web Worker for accurate Pomodoro countdown even when tab is inactive or mobile screen is locked

interface WorkerStartMessage {
  type: 'START';
  targetEndTime: number; // timestamp in ms
}

interface WorkerStopMessage {
  type: 'STOP';
}

type WorkerMessage = WorkerStartMessage | WorkerStopMessage;

let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;

  if (data.type === 'START') {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const { targetEndTime } = data;

    const tick = () => {
      const now = Date.now();
      const remainingMs = targetEndTime - now;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      self.postMessage({
        type: 'TICK',
        remainingSeconds,
      });

      if (remainingMs <= 0) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        self.postMessage({
          type: 'COMPLETE',
        });
      }
    };

    tick();
    intervalId = setInterval(tick, 250);
  } else if (data.type === 'STOP') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
