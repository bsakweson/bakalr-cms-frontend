/**
 * Runtime Config API Endpoint
 *
 * Returns the runtime configuration as JSON.
 * This is used by the client to fetch config if the inline script fails.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    cmsApiUrl: process.env.NEXT_PUBLIC_CMS_API_URL || process.env.CMS_API_URL || 'http://localhost:8000',
    platformApiUrl: process.env.NEXT_PUBLIC_PLATFORM_API_URL || process.env.PLATFORM_API_URL || 'http://localhost:8080',
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
