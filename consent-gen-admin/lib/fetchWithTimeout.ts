/**
 * Wraps a promise with a timeout so Supabase queries don't hang forever
 * when the network/DNS is blocked (e.g. ISP-level blocks in some regions).
 */
export function withTimeout<T = any>(promise: PromiseLike<T> | Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms / 1000}s. Check your network or DNS settings.`));
    }, ms);
    Promise.resolve(promise).then(
      (val) => { clearTimeout(timer); resolve(val as T); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
