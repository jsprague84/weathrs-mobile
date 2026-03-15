/**
 * Typography constants for consistent font sizing and weights
 */

export const Typography = {
  display: 64,     // main temperature
  title: 24,       // city name, section headers
  heading: 18,     // card titles
  body: 16,        // standard text, inputs
  label: 14,       // labels, secondary info
  caption: 12,     // hints, timestamps
  small: 11,       // chart labels, detail subtext
  micro: 10,       // minimal annotations
} as const;

export const FontWeight = {
  thin: '200' as const,      // temperature display
  regular: '400' as const,   // body text
  medium: '500' as const,    // labels
  semibold: '600' as const,  // headings, values
  bold: '700' as const,      // titles
} as const;
