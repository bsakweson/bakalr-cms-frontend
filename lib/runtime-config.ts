/**
 * Runtime Configuration for Next.js
 *
 * This module provides runtime environment variables that can be changed
 * without rebuilding the Docker image. It works by:
 *
 * 1. Server-side: Reads from process.env directly
 * 2. Client-side: Reads from window.__RUNTIME_CONFIG__ which is injected
 *    via a script tag in the HTML
 *
 * ARCHITECTURE:
 * -------------
 * Services are exposed through Kubernetes Ingress with subdomain routing:
 *
 *   cms.bakalr.com/*     → CMS Backend (FastAPI)
 *   bakalr.com/*         → Platform Services (inventory, orders, customers, employees)
 *
 * Benefits:
 * - Clear separation between CMS and platform services
 * - Each domain can scale independently
 * - K8s ingress handles SSL termination and routing
 * - CMS is not a bottleneck for platform requests
 *
 * Usage:
 *   import { getRuntimeConfig } from '@/lib/runtime-config';
 *   const config = getRuntimeConfig();
 *   // CMS: `${config.cmsApiUrl}/api/v1/content`
 *   // Platform: `${config.platformApiUrl}/api/v1/inventory/products`
 */

export interface RuntimeConfig {
  // CMS API - cms.bakalr.com
  cmsApiUrl: string;

  // Platform API - bakalr.com (inventory, orders, customers, employees)
  platformApiUrl: string;
}

// Default configuration (used during build and as fallback)
const defaultConfig: RuntimeConfig = {
  cmsApiUrl: 'http://localhost:8000',
  platformApiUrl: 'http://localhost:8080',
};

/**
 * Get runtime configuration
 * Works on both server and client side
 */
export function getRuntimeConfig(): RuntimeConfig {
  // Server-side: read from process.env
  if (typeof window === 'undefined') {
    return {
      cmsApiUrl: process.env.NEXT_PUBLIC_CMS_API_URL || process.env.CMS_API_URL || defaultConfig.cmsApiUrl,
      platformApiUrl: process.env.NEXT_PUBLIC_PLATFORM_API_URL || process.env.PLATFORM_API_URL || defaultConfig.platformApiUrl,
    };
  }

  // Client-side: read from injected window config
  const windowConfig = (window as Window & { __RUNTIME_CONFIG__?: RuntimeConfig }).__RUNTIME_CONFIG__;

  if (windowConfig) {
    return {
      cmsApiUrl: windowConfig.cmsApiUrl || defaultConfig.cmsApiUrl,
      platformApiUrl: windowConfig.platformApiUrl || defaultConfig.platformApiUrl,
    };
  }

  // Fallback to NEXT_PUBLIC_ env vars (available at build time)
  return {
    cmsApiUrl: process.env.NEXT_PUBLIC_CMS_API_URL || defaultConfig.cmsApiUrl,
    platformApiUrl: process.env.NEXT_PUBLIC_PLATFORM_API_URL || defaultConfig.platformApiUrl,
  };
}

/**
 * Generate the runtime config script to inject into HTML
 * Used by the custom _document or middleware
 */
export function getRuntimeConfigScript(): string {
  const config = getRuntimeConfig();
  return `window.__RUNTIME_CONFIG__ = ${JSON.stringify(config)};`;
}
