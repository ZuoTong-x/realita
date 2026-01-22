import { useEffect, useState, useCallback } from "react";

type UseCountdown = (
  time?: number
) => [
  count: number,
  disabled: boolean,
  start: (duration?: number) => void,
  cancel: () => void,
];

const useCountdown: UseCountdown = (time: number = 60) => {
  const [count, setCount] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [duration, setDuration] = useState(time);

  useEffect(() => {
    if (!disabled) return;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled]);

  const start = useCallback(
    (d: number = duration) => {
      setDuration(d);
      setCount(d);
      setDisabled(true);
    },
    [duration]
  );

  const cancel = useCallback(() => {
    setCount(0);
    setDisabled(false);
  }, []);

  return [count, disabled, start, cancel];
};

export default useCountdown;
