import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const hashParams = new URLSearchParams(requestUrl.hash.substring(1));
  
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = hashParams.get('type');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (errorCode) {
    console.error('Supabase auth error:', errorCode, errorDescription);
    return NextResponse.redirect(new URL('/login?error=email_confirmation_failed&message=' + encodeURIComponent(errorDescription || 'Email confirmation failed'), request.url));
  }

  if (accessToken && refreshToken) {
    const supabase = getSupabaseClient();
    
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
    }

    if (type === 'signup' || type === 'email_change') {
      return NextResponse.redirect(new URL('/?verified=true', request.url));
    }
    
    return NextResponse.redirect(new URL('/?authenticated=true', request.url));
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
}