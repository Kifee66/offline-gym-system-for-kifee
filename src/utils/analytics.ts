export async function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; ga?: (...args: unknown[]) => void };
    if (w.gtag) {
      // Standard GA4 event via gtag
      w.gtag('event', eventName, params);
    } else if (w.ga) {
      // fallback for older analytics.js
      w.ga('send', 'event', eventName, JSON.stringify(params));
    }
  } catch (error) {
    // swallow errors; analytics should not break UX
  console.error('trackEvent error:', error);
  }
}

export default trackEvent;
