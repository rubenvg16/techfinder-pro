import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = params;
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Try to find by external_id first (product ID from search)
    const { data: byExternalId, error: error1 } = await supabase
      .from('saved_products')
      .select('*')
      .eq('user_id', userId)
      .eq('external_id', id)
      .single();

    if (byExternalId) {
      // Format for frontend
      const product = {
        id: byExternalId.external_id,
        title: byExternalId.title,
        price: parseFloat(byExternalId.price),
        currency: byExternalId.currency,
        source: byExternalId.source,
        url: byExternalId.url,
        imageUrl: byExternalId.image_url,
        savedId: byExternalId.id,
      };
      
      return NextResponse.json({ product, source: 'database' });
    }

    // If not found by external_id, try by internal UUID
    const { data: byUuid, error: error2 } = await supabase
      .from('saved_products')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (byUuid) {
      const product = {
        id: byUuid.external_id,
        title: byUuid.title,
        price: parseFloat(byUuid.price),
        currency: byUuid.currency,
        source: byUuid.source,
        url: byUuid.url,
        imageUrl: byUuid.image_url,
        savedId: byUuid.id,
      };
      
      return NextResponse.json({ product, source: 'database' });
    }

    // Product not found in database
    return NextResponse.json(
      { error: 'Product not found. It may not be saved yet.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}