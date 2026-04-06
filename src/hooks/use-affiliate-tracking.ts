/**
 * Affiliate click tracking — lightweight localStorage counter.
 * Fire-and-forget: call on link click, never blocks navigation.
 */

export function trackAffiliateClick(quoteId: string, affiliateUrl: string): void {
  try {
    const key = 'sf-affiliate-clicks';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    data[quoteId] = (data[quoteId] || 0) + 1;
    data._total = (data._total || 0) + 1;
    data._lastClick = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}
