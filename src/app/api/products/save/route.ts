import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const supabase = getSupabaseClient();
    
    let session = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && userData?.user) {
        session = { user: userData.user };
      }
    }
    
    if (!session) {
      const { data: { session: cookieSession } } = await supabase.auth.getSession();
      session = cookieSession;
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { product } = body;

    if (!product) {
      return NextResponse.json(
        { error: 'Missing product' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if product already exists for this user (use regular client with RLS)
    const { data: existing } = await supabase
      .from('saved_products')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', product.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Product already saved', saved: true },
        { status: 200 }
      );
    }

    // Save the product using regular client with RLS
    const { data, error } = await supabase
      .from('saved_products')
      .insert({
        user_id: userId,
        external_id: product.id,
        source: product.source,
        title: product.title,
        price: product.price,
        currency: product.currency || 'USD',
        url: product.url,
        image_url: product.imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    console.error('Save product error:', error);
    return NextResponse.json(
      { error: 'Failed to save product' },
      { status: 500 }
    );
  }
}