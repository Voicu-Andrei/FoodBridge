import { useEffect, useState } from 'react';

/** Current time that re-renders the caller every `intervalMs` (for countdowns). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

/** Current time refreshed on animation frames (~30 fps) while `active`, for smooth moving markers. */
export function useFrameNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const tick = (ts: number) => {
      if (ts - last > 33) {
        last = ts;
        setNow(Date.now());
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return now;
}
