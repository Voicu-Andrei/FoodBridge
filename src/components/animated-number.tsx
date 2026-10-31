import { useEffect, useRef, useState } from 'react';

import { Txt, type TxtProps } from '@/components/text';

/** Eases a number from its previous value to `value` (count-up effect). */
export function useCountUp(value: number, duration = 1100): number {
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = from + (value - from) * eased;
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

type AnimatedNumberProps = Omit<TxtProps, 'children'> & {
  value: number;
  format?: (n: number) => string;
};

export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), ...rest }: AnimatedNumberProps) {
  const display = useCountUp(value);
  return <Txt {...rest}>{format(display)}</Txt>;
}
