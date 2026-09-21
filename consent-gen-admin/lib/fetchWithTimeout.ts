/**
 * Wraps a promise with a timeout so Supabase queries don't hang forever
 * when the network/DNS is blocked (e.g. ISP-level blocks in some regions).
 */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms / 1000}s. Check your network or DNS settings.`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
