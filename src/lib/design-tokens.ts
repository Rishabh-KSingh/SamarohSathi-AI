/**
 * SamarohSathi AI — Design Token System
 * Direction 1: Royal Heritage & Sandalwood (Locked & Approved)
 * Single source of truth for color tokens, typography, radii, and elevations.
 */

export const designTokens = {
  name: "Royal Heritage & Sandalwood",
  colors: {
    // Canvas & Surfaces
    background: "#FBF9F5",      // Warm Linen canvas
    surface: "#FFFFFF",         // Crisp Ivory cards & panels
    sidebar: "#F5F2EB",         // Subtle Warm Linen tone for persistent sidebar
    
    // Brand Colors
    primary: "#5B1D2E",         // Imperial Deep Burgundy (Hero/CTA)
    primaryForeground: "#FFFFFF",
    accent: "#C8963E",          // Antique Gold (Accents, rings, badges)
    accentForeground: "#1F1A17",
    
    // Typography Colors
    main: "#1F1A17",            // Deep Obsidian Umber (Main Headings & Body)
    muted: "#6B635B",           // Warm Slate Gray (Secondary & Metadata)
    
    // Structural Lines
    border: "#EBE5DC",          // Whisper Sand (Subtle dividers & card borders)
    
    // Status Indicators
    success: "#3F7A56",         // Sage Green (Completed tasks, on-track budget)
    warning: "#D9822B",         // Warm Amber (Upcoming deadlines, tight margins)
    error: "#C23B38",           // Crimson Rose (Overruns, blockers, critical alerts)
  },
  typography: {
    fontFamilies: {
      serif: "var(--font-serif), 'Playfair Display', Georgia, serif",
      sans: "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
    },
    hierarchy: {
      h1: "font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1F1A17]",
      h2: "font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#1F1A17]",
      h3: "font-serif text-xl sm:text-2xl font-medium text-[#1F1A17]",
      body: "font-sans text-sm sm:text-base text-[#1F1A17] leading-relaxed",
      bodyMuted: "font-sans text-sm text-[#6B635B] leading-normal",
      caption: "font-sans text-xs tracking-wider uppercase font-semibold text-[#6B635B]",
    },
  },
  radii: {
    card: "rounded-2xl",        // 16px
    button: "rounded-xl",       // 12px
    input: "rounded-xl",        // 12px
    badge: "rounded-full",
  },
  shadows: {
    subtle: "0 1px 3px rgba(31, 26, 23, 0.04), 0 1px 2px rgba(31, 26, 23, 0.02)",
    cardHover: "0 4px 12px rgba(31, 26, 23, 0.06)",
  },
} as const;

export type DesignTokens = typeof designTokens;
