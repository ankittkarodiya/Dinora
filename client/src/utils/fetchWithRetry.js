// Generic retry wrapper — useful for calls made right after page load,
// e.g. when a laptop just woke from sleep and the very first network
// request can fail even though everything is actually fine a moment later.
export async function fetchWithRetry(fn, { retries = 2, delayMs = 800 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}