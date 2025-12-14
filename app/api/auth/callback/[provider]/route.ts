/**
 * OAuth2 Callback Handler
 * Handles the redirect from OAuth providers and exchanges the code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=Missing authorization code or state', request.url)
    );
  }

  // Build the redirect URI (must match what was sent in the authorization request)
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/${provider}`;

  try {
    // Exchange code for tokens via our backend API
    const response = await fetch(`${API_URL}/api/v1/auth/social/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        code,
        state,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.detail || 'Authentication failed';
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    const data = await response.json();

    // Create response that redirects to callback page with tokens in URL fragment
    // The callback page will store tokens and redirect to dashboard
    const callbackUrl = new URL('/auth/callback', request.url);
    
    // Pass data via URL hash (not query params for security - they don't go to server)
    const hashParams = new URLSearchParams({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: JSON.stringify(data.user),
      is_new_user: data.is_new_user.toString(),
    });
    
    callbackUrl.hash = hashParams.toString();
    
    return NextResponse.redirect(callbackUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/login?error=Authentication service unavailable', request.url)
    );
  }
}
