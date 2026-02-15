// Trailing throttle: run once `delay` ms after the first call in a burst,
// using the latest arguments seen during that window.
export default function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: TArgs | undefined;

  return (...args: TArgs) => {
    latestArgs = args;
    if (timeoutId !== undefined) return;

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (!latestArgs) return;
      fn(...latestArgs);
    }, delay);
  };
}
