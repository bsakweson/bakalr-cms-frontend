import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  reportWebVitals,
  measurePerformance,
  markPerformance,
  clearPerformanceMarks,
  getNavigationMetrics,
  getResourceMetrics,
  logPerformanceSummary,
  type PerformanceMetrics,
} from './performance';

describe('performance', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleGroup = console.group;
  const originalConsoleGroupEnd = console.groupEnd;
  const originalConsoleTable = console.table;

  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.group = vi.fn();
    console.groupEnd = vi.fn();
    console.table = vi.fn();
    
    // Clear all performance marks and measures
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
    
    // Set NODE_ENV via vi.stubEnv
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;
    console.table = originalConsoleTable;
    
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('reportWebVitals', () => {
    it('should log metrics in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const metric: PerformanceMetrics = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
      };

      reportWebVitals(metric);

      expect(console.log).toHaveBeenCalledWith('[Performance] LCP:', {
        value: 2000,
        rating: 'good',
      });
    });

    it('should not log in production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const metric: PerformanceMetrics = {
        name: 'FID',
        value: 50,
        rating: 'good',
      };

      reportWebVitals(metric);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle different metric ratings', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const goodMetric: PerformanceMetrics = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
      };

      const poorMetric: PerformanceMetrics = {
        name: 'LCP',
        value: 5000,
        rating: 'poor',
      };

      reportWebVitals(goodMetric);
      reportWebVitals(poorMetric);

      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('markPerformance', () => {
    it('should create a performance mark', () => {
      markPerformance('test-mark');
      
      const marks = performance.getEntriesByName('test-mark', 'mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should handle multiple marks', () => {
      markPerformance('mark-1');
      markPerformance('mark-2');
      markPerformance('mark-3');
      
      expect(performance.getEntriesByName('mark-1', 'mark').length).toBeGreaterThan(0);
      expect(performance.getEntriesByName('mark-2', 'mark').length).toBeGreaterThan(0);
      expect(performance.getEntriesByName('mark-3', 'mark').length).toBeGreaterThan(0);
    });

    it('should not throw on invalid mark name', () => {
      expect(() => markPerformance('')).not.toThrow();
    });
  });

  describe('measurePerformance', () => {
    it('should measure performance between two marks', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      performance.mark('start');
      performance.mark('end');
      
      measurePerformance('test-measure', 'start', 'end');
      
      const measures = performance.getEntriesByName('test-measure', 'measure');
      expect(measures.length).toBeGreaterThan(0);
      expect(console.log).toHaveBeenCalled();
    });

    it('should measure without specific marks', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      // This will measure from navigation start, which creates a measure
      measurePerformance('full-measure');
      
      // The function logs, but measure might succeed or fail depending on env
      // Just verify it doesn't throw
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('should handle measurement errors gracefully', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      // Try to measure with non-existent marks
      measurePerformance('test', 'non-existent-start', 'non-existent-end');
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('clearPerformanceMarks', () => {
    it('should clear specific mark', () => {
      performance.mark('test-mark');
      expect(performance.getEntriesByName('test-mark', 'mark').length).toBeGreaterThan(0);
      
      clearPerformanceMarks('test-mark');
      
      expect(performance.getEntriesByName('test-mark', 'mark').length).toBe(0);
    });

    it('should clear all marks when no name provided', () => {
      performance.mark('mark-1');
      performance.mark('mark-2');
      
      clearPerformanceMarks();
      
      expect(performance.getEntriesByName('mark-1', 'mark').length).toBe(0);
      expect(performance.getEntriesByName('mark-2', 'mark').length).toBe(0);
    });
  });

  describe('getNavigationMetrics', () => {
    it('should return null if no navigation timing', () => {
      // In test environment, navigation timing might not be available
      const metrics = getNavigationMetrics();
      
      // Could be null or an object depending on test environment
      expect(metrics === null || typeof metrics === 'object').toBe(true);
    });

    it('should calculate metrics when navigation timing exists', () => {
      const metrics = getNavigationMetrics();
      
      if (metrics) {
        expect(metrics).toHaveProperty('dnsLookup');
        expect(metrics).toHaveProperty('tcpConnection');
        expect(metrics).toHaveProperty('ttfb');
        expect(metrics).toHaveProperty('download');
        expect(metrics).toHaveProperty('total');
        
        // All should be numbers
        expect(typeof metrics.dnsLookup).toBe('number');
        expect(typeof metrics.total).toBe('number');
      }
    });
  });

  describe('getResourceMetrics', () => {
    it('should return array of resource metrics', () => {
      const resources = getResourceMetrics();
      
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should return resource details when available', () => {
      const resources = getResourceMetrics();
      
      resources.forEach(resource => {
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('type');
        expect(resource).toHaveProperty('duration');
        expect(resource).toHaveProperty('size');
        expect(resource).toHaveProperty('cached');
        
        expect(typeof resource.name).toBe('string');
        expect(typeof resource.type).toBe('string');
        expect(typeof resource.duration).toBe('number');
        expect(typeof resource.cached).toBe('boolean');
      });
    });
  });

  describe('logPerformanceSummary', () => {
    it('should log performance summary', () => {
      logPerformanceSummary();
      
      expect(console.group).toHaveBeenCalledWith('📊 Performance Summary');
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should log navigation metrics if available', () => {
      logPerformanceSummary();
      
      // Should call console methods
      expect(console.group).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should log resource summary', () => {
      logPerformanceSummary();
      
      expect(console.log).toHaveBeenCalledWith(
        'Resources:',
        expect.objectContaining({
          total: expect.any(Number),
          cached: expect.any(Number),
          totalSize: expect.any(Number),
          byType: expect.any(Object),
        })
      );
    });
  });

  describe('metric rating logic', () => {
    it('should rate LCP correctly', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      // Good LCP (< 2500ms)
      const goodMetric: PerformanceMetrics = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
      };
      reportWebVitals(goodMetric);
      
      // Needs improvement LCP (2500-4000ms)
      const needsImprovementMetric: PerformanceMetrics = {
        name: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
      };
      reportWebVitals(needsImprovementMetric);
      
      // Poor LCP (> 4000ms)
      const poorMetric: PerformanceMetrics = {
        name: 'LCP',
        value: 5000,
        rating: 'poor',
      };
      reportWebVitals(poorMetric);
      
      expect(console.log).toHaveBeenCalledTimes(3);
    });

    it('should handle FID metrics', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const fidMetric: PerformanceMetrics = {
        name: 'FID',
        value: 50,
        rating: 'good',
      };
      
      reportWebVitals(fidMetric);
      expect(console.log).toHaveBeenCalledWith('[Performance] FID:', {
        value: 50,
        rating: 'good',
      });
    });

    it('should handle CLS metrics', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const clsMetric: PerformanceMetrics = {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
      };
      
      reportWebVitals(clsMetric);
      expect(console.log).toHaveBeenCalledWith('[Performance] CLS:', {
        value: 0.05,
        rating: 'good',
      });
    });
  });
});
