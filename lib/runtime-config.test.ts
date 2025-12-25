import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRuntimeConfig, getRuntimeConfigScript, RuntimeConfig } from './runtime-config';

describe('runtime-config', () => {
  const originalWindow = global.window;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.window = originalWindow;
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getRuntimeConfig', () => {
    describe('server-side (window undefined)', () => {
      beforeEach(() => {
        // Simulate server-side by removing window
        // @ts-ignore
        delete global.window;
      });

      it('should return default config when no env vars are set', () => {
        // Clear relevant env vars
        delete process.env.NEXT_PUBLIC_CMS_API_URL;
        delete process.env.CMS_API_URL;
        delete process.env.NEXT_PUBLIC_PLATFORM_API_URL;
        delete process.env.PLATFORM_API_URL;

        const config = getRuntimeConfig();

        expect(config).toEqual({
          cmsApiUrl: 'http://localhost:8000',
          platformApiUrl: 'http://localhost:8080',
        });
      });

      it('should prefer NEXT_PUBLIC_ prefixed vars over non-prefixed', () => {
        process.env.NEXT_PUBLIC_CMS_API_URL = 'https://cms.example.com';
        process.env.CMS_API_URL = 'https://fallback.example.com';
        process.env.NEXT_PUBLIC_PLATFORM_API_URL = 'https://platform.example.com';
        process.env.PLATFORM_API_URL = 'https://platform-fallback.example.com';

        const config = getRuntimeConfig();

        expect(config.cmsApiUrl).toBe('https://cms.example.com');
        expect(config.platformApiUrl).toBe('https://platform.example.com');
      });

      it('should fall back to non-prefixed vars when NEXT_PUBLIC_ not set', () => {
        delete process.env.NEXT_PUBLIC_CMS_API_URL;
        process.env.CMS_API_URL = 'https://cms-from-env.example.com';
        delete process.env.NEXT_PUBLIC_PLATFORM_API_URL;
        process.env.PLATFORM_API_URL = 'https://platform-from-env.example.com';

        const config = getRuntimeConfig();

        expect(config.cmsApiUrl).toBe('https://cms-from-env.example.com');
        expect(config.platformApiUrl).toBe('https://platform-from-env.example.com');
      });
    });

    describe('client-side with window.__RUNTIME_CONFIG__', () => {
      beforeEach(() => {
        // Restore window for client-side tests
        global.window = originalWindow || ({} as any);
      });

      it('should read from window.__RUNTIME_CONFIG__ when available', () => {
        const mockConfig: RuntimeConfig = {
          cmsApiUrl: 'https://cms.bakalr.com',
          platformApiUrl: 'https://bakalr.com',
        };

        (global.window as any).__RUNTIME_CONFIG__ = mockConfig;

        const config = getRuntimeConfig();

        expect(config.cmsApiUrl).toBe('https://cms.bakalr.com');
        expect(config.platformApiUrl).toBe('https://bakalr.com');

        // Cleanup
        delete (global.window as any).__RUNTIME_CONFIG__;
      });

      it('should use defaults for missing window config properties', () => {
        (global.window as any).__RUNTIME_CONFIG__ = {
          cmsApiUrl: 'https://cms.example.com',
          // platformApiUrl missing
        };

        const config = getRuntimeConfig();

        expect(config.cmsApiUrl).toBe('https://cms.example.com');
        expect(config.platformApiUrl).toBe('http://localhost:8080');

        // Cleanup
        delete (global.window as any).__RUNTIME_CONFIG__;
      });

      it('should fall back to NEXT_PUBLIC_ vars when window config undefined', () => {
        delete (global.window as any).__RUNTIME_CONFIG__;
        process.env.NEXT_PUBLIC_CMS_API_URL = 'https://build-time-cms.example.com';

        const config = getRuntimeConfig();

        expect(config.cmsApiUrl).toBe('https://build-time-cms.example.com');
      });

      it('should return defaults when no window config and no env vars', () => {
        delete (global.window as any).__RUNTIME_CONFIG__;
        delete process.env.NEXT_PUBLIC_CMS_API_URL;
        delete process.env.NEXT_PUBLIC_PLATFORM_API_URL;

        const config = getRuntimeConfig();

        expect(config).toEqual({
          cmsApiUrl: 'http://localhost:8000',
          platformApiUrl: 'http://localhost:8080',
        });
      });
    });
  });

  describe('getRuntimeConfigScript', () => {
    beforeEach(() => {
      // Run as server-side
      // @ts-ignore
      delete global.window;
    });

    it('should generate valid JavaScript assignment', () => {
      process.env.NEXT_PUBLIC_CMS_API_URL = 'https://cms.bakalr.com';
      process.env.NEXT_PUBLIC_PLATFORM_API_URL = 'https://bakalr.com';

      const script = getRuntimeConfigScript();

      expect(script).toContain('window.__RUNTIME_CONFIG__');
      expect(script).toContain('https://cms.bakalr.com');
      expect(script).toContain('https://bakalr.com');
    });

    it('should produce valid JSON in the script', () => {
      const script = getRuntimeConfigScript();

      // Extract JSON from script
      const jsonMatch = script.match(/window\.__RUNTIME_CONFIG__ = (.+);/);
      expect(jsonMatch).not.toBeNull();

      const config = JSON.parse(jsonMatch![1]);
      expect(config).toHaveProperty('cmsApiUrl');
      expect(config).toHaveProperty('platformApiUrl');
    });

    it('should escape special characters in URLs', () => {
      process.env.NEXT_PUBLIC_CMS_API_URL = 'https://cms.example.com/path?query=value&other=123';

      const script = getRuntimeConfigScript();
      const jsonMatch = script.match(/window\.__RUNTIME_CONFIG__ = (.+);/);
      const config = JSON.parse(jsonMatch![1]);

      expect(config.cmsApiUrl).toBe('https://cms.example.com/path?query=value&other=123');
    });

    it('should work with default values', () => {
      delete process.env.NEXT_PUBLIC_CMS_API_URL;
      delete process.env.CMS_API_URL;
      delete process.env.NEXT_PUBLIC_PLATFORM_API_URL;
      delete process.env.PLATFORM_API_URL;

      const script = getRuntimeConfigScript();
      const jsonMatch = script.match(/window\.__RUNTIME_CONFIG__ = (.+);/);
      const config = JSON.parse(jsonMatch![1]);

      expect(config.cmsApiUrl).toBe('http://localhost:8000');
      expect(config.platformApiUrl).toBe('http://localhost:8080');
    });
  });

  describe('RuntimeConfig interface', () => {
    it('should have required properties', () => {
      const config: RuntimeConfig = {
        cmsApiUrl: 'https://cms.bakalr.com',
        platformApiUrl: 'https://bakalr.com',
      };

      expect(config.cmsApiUrl).toBeDefined();
      expect(config.platformApiUrl).toBeDefined();
    });
  });
});
