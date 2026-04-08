import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendPriceAlert } from '@/lib/alerts';
import { searchWithTimeout } from '@/lib/aggregator';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  const { data: alerts, error: fetchError } = await supabase
    .from('alerts')
    .select(`
      *,
      product:products(*),
      user:profiles(email)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100);

  if (fetchError) {
    console.error('Error fetching alerts:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  let processedCount = 0;
  let triggeredCount = 0;
  const errors: string[] = [];

  for (const alert of alerts || []) {
    try {
      const searchResults = await searchWithTimeout(alert.product.title);

      const currentProduct = searchResults.products.find(
        (p) => p.source === alert.product.source
      );

      if (!currentProduct) {
        continue;
      }

      const currentPrice = currentProduct.price;

      if (currentPrice < alert.target_price) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', alert.user_id)
          .single();

        if (!userData?.email) {
          errors.push(`No email for alert ${alert.id}`);
          continue;
        }

        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/alerts/unsubscribe?alertId=${alert.id}&userId=${alert.user_id}`;

        const emailSent = await sendPriceAlert({
          to: userData.email,
          product: currentProduct,
          targetPrice: alert.target_price,
          currentPrice,
          unsubscribeUrl,
        });

        if (emailSent) {
          await supabase
            .from('alerts')
            .update({
              is_active: false,
              last_notified_at: new Date().toISOString(),
            })
            .eq('id', alert.id);

          triggeredCount++;
        }
      }

      processedCount++;
    } catch (error) {
      errors.push(`Error processing alert ${alert.id}: ${error}`);
      console.error(`Error processing alert ${alert.id}:`, error);
    }
  }

  return NextResponse.json({
    processed: processedCount,
    triggered: triggeredCount,
    errors: errors.length > 0 ? errors : undefined,
  });
}
