/**
 * Centralized logo fetching utilities with multiple fallback sources
 * Provides cascading fallback logic for company logos with error tracking
 */

/**
 * Gets the primary logo URL using Google S2 Favicons API
 * Serves PNG format which is React Native compatible
 * 
 * @param domain - The company domain (e.g., 'netflix.com')
 * @param size - Icon size in pixels (default: 64)
 * @returns URL string for the logo
 */
export const getCompanyLogoUrl = (domain: string, size: number = 64): string => {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`;
};

/**
 * Gets the fallback logo URL using DuckDuckGo Icons API
 * Used when primary source (Google S2 Favicons) fails
 * Note: DuckDuckGo serves .ico format which has React Native compatibility considerations
 *
 * @param domain - The company domain (e.g., 'netflix.com')
 * @returns URL string for the fallback logo
 */
export const getCompanyLogoFallbackUrl = (domain: string): string => {
  if (!domain) return '';
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
};

/**
 * Logo source types for tracking which source is currently being used
 */
export type LogoSource = 'primary' | 'fallback' | 'none';

/**
 * Gets the next logo source to try based on current source
 * Implements cascading fallback logic: primary -> fallback -> none
 * 
 * @param currentSource - The current logo source being used
 * @returns The next logo source to attempt
 */
export const getNextLogoSource = (currentSource: LogoSource): LogoSource => {
  switch (currentSource) {
    case 'primary':
      return 'fallback';
    case 'fallback':
      return 'none';
    default:
      return 'none';
  }
};

/**
 * Gets the logo URL for a specific source type
 * 
 * @param domain - The company domain
 * @param source - Which logo source to use
 * @param size - Icon size in pixels (default: 64)
 * @returns URL string for the logo, or empty string if source is 'none'
 */
export const getLogoUrlForSource = (
  domain: string,
  source: LogoSource,
  size: number = 64
): string => {
  switch (source) {
    case 'primary':
      return getCompanyLogoUrl(domain, size);
    case 'fallback':
      return getCompanyLogoFallbackUrl(domain);
    case 'none':
    default:
      return '';
  }
};