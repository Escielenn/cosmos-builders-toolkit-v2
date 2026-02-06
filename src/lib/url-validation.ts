/**
 * URL validation utilities for preventing open redirect vulnerabilities.
 * Only allows redirects to trusted domains.
 */

const TRUSTED_DOMAINS: Record<string, string[]> = {
  stripe: ["checkout.stripe.com", "billing.stripe.com"],
  notion: ["www.notion.so", "notion.so", "api.notion.com"],
};

/**
 * Validates that a URL is from a trusted domain for the given service.
 * Returns true if the URL is safe to redirect to, false otherwise.
 */
export function isValidRedirectUrl(url: string, service: keyof typeof TRUSTED_DOMAINS): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    const trustedDomains = TRUSTED_DOMAINS[service];
    if (!trustedDomains) {
      return false;
    }

    // Check if the hostname matches any trusted domain
    const hostname = parsed.hostname.toLowerCase();
    return trustedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Safely redirect to a URL only if it passes validation.
 * Throws an error if the URL is not trusted.
 */
export function safeRedirect(url: string, service: keyof typeof TRUSTED_DOMAINS): void {
  if (!isValidRedirectUrl(url, service)) {
    throw new Error(`Invalid redirect URL for ${service}`);
  }
  window.location.href = url;
}

/**
 * Safely open a URL in a new window only if it passes validation.
 * Returns null if the URL is not trusted.
 */
export function safeOpenWindow(
  url: string,
  service: keyof typeof TRUSTED_DOMAINS,
  target: string = "_blank",
  features?: string
): Window | null {
  if (!isValidRedirectUrl(url, service)) {
    console.error(`Blocked opening untrusted URL for ${service}:`, url);
    return null;
  }
  return window.open(url, target, features);
}
