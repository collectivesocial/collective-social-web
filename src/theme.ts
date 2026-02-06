import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Warm amber/terracotta accent palette
        accent: {
          50: { value: "#FDF4EE" },
          100: { value: "#F9E1D0" },
          200: { value: "#F2C4A1" },
          300: { value: "#E8A272" },
          400: { value: "#D4814D" },
          500: { value: "#C2703E" }, // Primary accent
          600: { value: "#A85A2F" },
          700: { value: "#8B4624" },
          800: { value: "#6E3419" },
          900: { value: "#52240F" },
        },
        // Warm neutrals for surfaces and text
        warmGray: {
          50: { value: "#FAF8F6" }, // Lightest cream
          100: { value: "#F3EFE9" }, // Warm off-white
          200: { value: "#E8E2DA" }, // Light warm gray
          300: { value: "#D4CCC2" }, // Medium-light
          400: { value: "#B8AEA0" }, // Medium
          500: { value: "#9A8E7F" }, // Medium-dark
          600: { value: "#7A6F62" }, // Dark warm gray
          700: { value: "#5C5347" }, // Darker
          800: { value: "#3E3730" }, // Near black-brown
          900: { value: "#2A2420" }, // Deep charcoal-brown
          950: { value: "#1C1814" }, // Deepest dark
        },
        // Deep brown/charcoal for dark mode backgrounds
        shelf: {
          50: { value: "#F5F0EB" },
          100: { value: "#E6DDD4" },
          200: { value: "#C4B6A6" },
          300: { value: "#9E8C78" },
          400: { value: "#7A6B59" },
          500: { value: "#5C4F3F" },
          600: { value: "#433929" },
          700: { value: "#332B1F" }, // Dark mode card surface
          800: { value: "#241E17" }, // Dark mode elevated bg
          900: { value: "#1A1510" }, // Dark mode base bg
          950: { value: "#110E0A" }, // Dark mode deepest
        },
        // Warm amber for stars and highlights
        amber: {
          400: { value: "#F0B849" },
          500: { value: "#E5A832" },
          600: { value: "#D49A20" },
        },
      },
      fonts: {
        heading: { value: "'Playfair Display', Georgia, 'Times New Roman', serif" },
        body: {
          value:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      },
      radii: {
        shelf: { value: "16px" }, // Cozy rounded card radius
      },
    },
    semanticTokens: {
      colors: {
        // Page background
        "bg.page": {
          value: { _light: "{colors.warmGray.50}", _dark: "{colors.shelf.900}" },
        },
        // Card surface
        "bg.card": {
          value: { _light: "{colors.white}", _dark: "{colors.shelf.700}" },
        },
        // Elevated surface (modals, popovers, dropdowns)
        "bg.elevated": {
          value: { _light: "{colors.white}", _dark: "{colors.shelf.800}" },
        },
        // Subtle surface (hover states, secondary areas)
        "bg.subtle": {
          value: { _light: "{colors.warmGray.100}", _dark: "{colors.shelf.800}" },
        },
        // Header/nav translucent bg
        "bg.nav": {
          value: {
            _light: "rgba(250, 248, 246, 0.85)",
            _dark: "rgba(26, 21, 16, 0.85)",
          },
        },
        // Primary text
        "fg.default": {
          value: { _light: "{colors.warmGray.900}", _dark: "{colors.warmGray.100}" },
        },
        // Secondary/muted text
        "fg.muted": {
          value: { _light: "{colors.warmGray.600}", _dark: "{colors.warmGray.400}" },
        },
        // Subtle text (timestamps, hints)
        "fg.subtle": {
          value: { _light: "{colors.warmGray.500}", _dark: "{colors.warmGray.500}" },
        },
        // Primary accent
        "accent.default": {
          value: { _light: "{colors.accent.500}", _dark: "{colors.accent.400}" },
        },
        // Accent hover
        "accent.hover": {
          value: { _light: "{colors.accent.600}", _dark: "{colors.accent.300}" },
        },
        // Accent muted (backgrounds, badges)
        "accent.muted": {
          value: { _light: "{colors.accent.50}", _dark: "{colors.accent.900}" },
        },
        // Card border
        "border.card": {
          value: { _light: "{colors.warmGray.200}", _dark: "{colors.shelf.600}" },
        },
        // Subtle border (dividers, separators)
        "border.subtle": {
          value: { _light: "{colors.warmGray.200}", _dark: "{colors.shelf.700}" },
        },
        // Focus ring
        "border.focus": {
          value: { _light: "{colors.accent.500}", _dark: "{colors.accent.400}" },
        },
        // Star/rating color
        "rating.star": {
          value: { _light: "{colors.amber.500}", _dark: "{colors.amber.400}" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg.page",
      color: "fg.default",
      fontFamily: "body",
      lineHeight: "1.6",
      minHeight: "100vh",
    },
    "#root": {
      minHeight: "100vh",
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "heading",
      fontWeight: "700",
      letterSpacing: "-0.01em",
    },
    a: {
      color: "accent.default",
      textDecoration: "none",
      _hover: {
        color: "accent.hover",
        textDecoration: "underline",
      },
    },
    "*::selection": {
      bg: "accent.muted",
      color: "accent.default",
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
