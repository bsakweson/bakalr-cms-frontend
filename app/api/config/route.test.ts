import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('/api/config route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('GET handler', () => {
    it('should return runtime config as JSON', async () => {
      // Import the route handler
      const { GET } = await import('./route');

      // Call the handler
      const response = await GET();

      // Verify response
      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      // Parse JSON body
      const body = await response.json();

      // Should have the expected structure (values come from test setup env)
      expect(body).toHaveProperty('cmsApiUrl');
      expect(body).toHaveProperty('platformApiUrl');
    });

    it('should set correct Content-Type header', async () => {
      const { GET } = await import('./route');
      const response = await GET();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should set Cache-Control header for short caching', async () => {
      const { GET } = await import('./route');
      const response = await GET();

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=60');
    });

    it('should return all required config properties', async () => {
      const { GET } = await import('./route');
      const response = await GET();
      const body = await response.json();

      // Verify all required properties exist
      expect(body).toHaveProperty('cmsApiUrl');
      expect(body).toHaveProperty('platformApiUrl');
    });

    it('should return string values for all config properties', async () => {
      const { GET } = await import('./route');
      const response = await GET();
      const body = await response.json();

      expect(typeof body.cmsApiUrl).toBe('string');
      expect(typeof body.platformApiUrl).toBe('string');
    });

    it('should return valid URLs for config properties', async () => {
      const { GET } = await import('./route');
      const response = await GET();
      const body = await response.json();

      // All values should be valid URLs (start with http:// or https://)
      expect(body.cmsApiUrl).toMatch(/^https?:\/\//);
      expect(body.platformApiUrl).toMatch(/^https?:\/\//);
    });
  });
});

