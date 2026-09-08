/** One shutdown path for deadline, participant departure, and pipeline failure. */
export function createSessionLifetime(
  maxSeconds: number,
  close: (reason: string) => Promise<void>
) {
  let completion: Promise<void> | undefined;
  const finish = (reason: string): Promise<void> => {
    if (completion) return completion;
    clearTimeout(timer);
    completion = Promise.resolve().then(() => close(reason));
    return completion;
  };
  const timer = setTimeout(() => {
    void finish('duration-limit');
  }, maxSeconds * 1000);
  return {
    finish,
    dispose: () => clearTimeout(timer),
    get finished() {
      return Boolean(completion);
    },
  };
}
