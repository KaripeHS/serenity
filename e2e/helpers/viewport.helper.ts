/**
 * Viewport Helper - Viewport configurations for responsive testing
 */

export const VIEWPORTS = {
  mobile: { width: 375, height: 812, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1920, height: 1080, name: 'desktop' },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

export const ALL_VIEWPORTS = Object.entries(VIEWPORTS) as [ViewportName, typeof VIEWPORTS[ViewportName]][];
