import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { Alert, AlertWithProduct } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  return NextResponse.json({ alerts: alerts || [] });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { productId, targetPrice } = body;

  if (!productId || typeof targetPrice !== 'number' || targetPrice <= 0 || targetPrice > 1000000) {
    return NextResponse.json(
      { error: 'Invalid productId or targetPrice' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }

  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      user_id: session.user.id,
      product_id: productId,
      target_price: targetPrice,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }

  return NextResponse.json({ alert }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const alertId = searchParams.get('id');

  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID is required' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
