/**
 * Static tenant configuration for DEFAULT branding and content.
 *
 * IMPORTANT: Tenants are managed dynamically in the Convex `tenants` table.
 * This file only provides FALLBACK branding for tenants that don't have
 * custom branding configured in the database.
 *
 * To add a new tenant:
 * 1. Create the tenant in Convex database (via admin UI or API)
 * 2. Configure the subdomain in Vercel
 * 3. (Optional) Add branding here for static defaults
 *
 * Core tenant data (slug, domain, displayName, logoUrl, primaryColor, status)
 * lives in the Convex `tenants` table for dynamic management.
 */

export interface TenantBranding {
  /** Display name shown in UI */
  name: string;
  /** Short name for compact spaces */
  shortName?: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Secondary brand color (hex) */
  secondaryColor?: string;
  /** Accent color for highlights (hex) */
  accentColor?: string;
  /** Sidebar background color (HSL values like "208 77% 51%" or hex) */
  sidebarBackground?: string;
  /** Sidebar foreground/text color (HSL values or hex) */
  sidebarForeground?: string;
  /** Logo URL for light backgrounds */
  logo: string;
  /** Logo URL for dark backgrounds */
  logoDark?: string;
  /** Favicon URL */
  favicon?: string;
}

export interface TenantContent {
  /** Tagline shown on landing/marketing pages */
  tagline: string;
  /** Meta description for SEO */
  metaDescription?: string;
  /** Custom labels/copy overrides */
  labels?: {
    /** Label for "categories" in this tenant's context */
    categories?: string;
    /** Label for "units" */
    units?: string;
    /** Label for "lessons" */
    lessons?: string;
  };
}

export interface TenantConfig {
  branding: TenantBranding;
  content: TenantContent;
}

/**
 * Configuration for all tenants.
 * Keys must match the `slug` field in the Convex `tenants` table.
 */
export const tenantsConfig = {
  // Default tenant - Ortoclub (app)
  app: {
    branding: {
      name: "Ortoclub",
      shortName: "OQB",
      primaryColor: "#2563eb", // Blue
      secondaryColor: "#1e40af",
      accentColor: "#3b82f6",
      logo: "/logo.webp",
      logoDark: "/logo.webp",
      favicon: "/favicon.ico",
    },
    content: {
      tagline: "Plataforma de vídeo-aulas de ortopedia",
      metaDescription:
        "Prepare-se com as melhores vídeo-aulas de ortopedia do Brasil.",
      labels: {
        categories: "Categorias",
        units: "Unidades",
        lessons: "Aulas",
      },
    },
  },

  // Demo tenant for testing
  demo: {
    branding: {
      name: "Demo Tenant",
      shortName: "DEMO",
      primaryColor: "#10b981", // Emerald
      secondaryColor: "#059669",
      accentColor: "#34d399",
      sidebarBackground: "158 64% 52%", // Emerald background
      sidebarForeground: "0 0% 100%", // White text
      logo: "/logo.webp",
      logoDark: "/logo.webp",
      favicon: "/favicon.ico",
    },
    content: {
      tagline: "Tenant de demonstração",
      metaDescription: "Tenant usado para demonstração e testes.",
      labels: {
        categories: "Categorias",
        units: "Módulos",
        lessons: "Vídeos",
      },
    },
  },

  // Test tenant for development
  test: {
    branding: {
      name: "Test Academy",
      shortName: "TEST",
      primaryColor: "#8b5cf6", // Violet
      secondaryColor: "#7c3aed",
      accentColor: "#a78bfa",
      sidebarBackground: "263 70% 50%", // Violet background
      sidebarForeground: "0 0% 100%", // White text
      logo: "/logo.webp",
      logoDark: "/logo.webp",
      favicon: "/favicon.ico",
    },
    content: {
      tagline: "Plataforma de testes e desenvolvimento",
      metaDescription: "Tenant usado para testes de desenvolvimento.",
      labels: {
        categories: "Categorias",
        units: "Unidades",
        lessons: "Aulas",
      },
    },
  },
} as const satisfies Record<string, TenantConfig>;

/** Type for valid tenant slugs */
export type TenantSlug = keyof typeof tenantsConfig;

/** Default tenant slug when none is detected */
export const DEFAULT_TENANT_SLUG: TenantSlug = "app";

/**
 * Get tenant configuration by slug.
 * Falls back to default tenant if slug is not found.
 */
export function getTenantConfig(slug: string): TenantConfig {
  if (slug in tenantsConfig) {
    return tenantsConfig[slug as TenantSlug];
  }
  return tenantsConfig[DEFAULT_TENANT_SLUG];
}

/**
 * Check if a slug is a valid tenant slug.
 */
export function isValidTenantSlug(slug: string): slug is TenantSlug {
  return slug in tenantsConfig;
}

/**
 * Get all available tenant slugs.
 */
export function getAllTenantSlugs(): TenantSlug[] {
  return Object.keys(tenantsConfig) as TenantSlug[];
}
