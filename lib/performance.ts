/**
 * Frontend performance monitoring utilities
 */

export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Web Vitals thresholds (in milliseconds)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

/**
 * Rate a performance metric based on thresholds
 */
function rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics or logging service
 */
export function reportWebVitals(metric: PerformanceMetrics) {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    // });
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });
  }
}

/**
 * Measure custom performance mark
 */
export function measurePerformance(name: string, startMark?: string, endMark?: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    if (startMark && endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name);
    }
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      const metric: PerformanceMetrics = {
        name,
        value: measure.duration,
        rating: rateMetric(name, measure.duration),
      };
      reportWebVitals(metric);
    }
  } catch (error) {
    console.error('Error measuring performance:', error);
  }
}

/**
 * Mark performance checkpoint
 */
export function markPerformance(name: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    performance.mark(name);
  } catch (error) {
    console.error('Error marking performance:', error);
  }
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceMarks(name?: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  } catch (error) {
    console.error('Error clearing performance marks:', error);
  }
}

/**
 * Get navigation timing metrics
 */
export function getNavigationMetrics() {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;
  
  return {
    // DNS lookup
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP connection
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    // TLS negotiation
    tlsNegotiation: navigation.secureConnectionStart > 0 
      ? navigation.connectEnd - navigation.secureConnectionStart 
      : 0,
    // Time to first byte
    ttfb: navigation.responseStart - navigation.requestStart,
    // Response download
    download: navigation.responseEnd - navigation.responseStart,
    // DOM processing
    domProcessing: navigation.domComplete - navigation.domInteractive,
    // Page load
    pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
    // Total time
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Get resource timing metrics
 */
export function getResourceMetrics() {
  if (typeof window === 'undefined' || !window.performance) return [];
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    type: resource.initiatorType,
    duration: resource.duration,
    size: resource.transferSize,
    cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
  }));
}

/**
 * Log performance summary
 */
export function logPerformanceSummary() {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const navigation = getNavigationMetrics();
  const resources = getResourceMetrics();
  
  console.group('📊 Performance Summary');
  
  if (navigation) {
    console.table(navigation);
  }
  
  const resourceSummary = {
    total: resources.length,
    cached: resources.filter(r => r.cached).length,
    totalSize: resources.reduce((sum, r) => sum + (r.size || 0), 0),
    byType: resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
  
  console.log('Resources:', resourceSummary);
  console.groupEnd();
}

/**
 * Hook into page load to log performance
 */
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait a bit for all metrics to be available
    setTimeout(logPerformanceSummary, 3000);
  });
}
