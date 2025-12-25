import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy handler for inventory service requests
 *
 * Route: /api/v1/inventory/[...path]
 * Forwards to: https://bakalr.com/api/v1/inventory/[...path]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params, 'DELETE');
}

async function handleProxy(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  const params = await paramsPromise;
  const inventoryUrl = process.env.INVENTORY_BACKEND_URL || 'https://bakalr.com';
  const path = params.path?.join('/') || '';

  // Forward to /api/v1/inventory/[path]
  const targetUrl = `${inventoryUrl}/api/v1/inventory/${path}${request.nextUrl.search}`;

  // Forward relevant headers
  const headers: HeadersInit = {};

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const tenantHeader = request.headers.get('x-tenant-id');
  if (tenantHeader) {
    headers['X-Tenant-ID'] = tenantHeader;
  }

  headers['Content-Type'] =
    request.headers.get('content-type') || 'application/json';

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Include body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[Inventory Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to inventory service' },
      { status: 502 }
    );
  }
}
