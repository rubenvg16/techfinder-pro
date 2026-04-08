import { Resend } from 'resend';
import { Product } from '@/types';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface PriceAlertEmailParams {
  to: string;
  product: Product;
  targetPrice: number;
  currentPrice: number;
  unsubscribeUrl: string;
}

export async function sendPriceAlert(params: PriceAlertParams): Promise<boolean> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return false;
  }

  const { to, product, targetPrice, currentPrice, unsubscribeUrl } = params;

  const savings = targetPrice - currentPrice;
  const savingsPercent = ((savings / targetPrice) * 100).toFixed(0);

  try {
    const { error } = await resend.emails.send({
      from: 'TechFinder Pro <alerts@techfinder-pro.com>',
      to,
      subject: `🔔 Price Alert: ${product.title} is now $${currentPrice}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #252525; border-radius: 12px; padding: 24px; }
            .header { text-align: center; margin-bottom: 24px; }
            .badge { background: #00DAAAA; color: #000; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
            .product-title { font-size: 20px; font-weight: 600; margin: 16px 0; }
            .price-box { background: #333; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .price { font-size: 32px; font-weight: bold; color: #00DAAAA; }
            .old-price { text-decoration: line-through; color: #888; margin-right: 12px; }
            .savings { color: #4ade80; font-weight: 600; }
            .btn { display: inline-block; background: #00DAAAA; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
            .footer { margin-top: 24px; font-size: 12px; color: #888; text-align: center; }
            .footer a { color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Price Drop Alert!</span>
            </div>
            
            <div class="product-title">${product.title}</div>
            
            <div class="price-box">
              <span class="old-price">$${targetPrice.toFixed(2)}</span>
              <span class="price">$${currentPrice.toFixed(2)}</span>
              <div class="savings">You save $${savings.toFixed(2)} (${savingsPercent}%)</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${product.url}" class="btn">View Product</a>
            </div>
            
            <div class="footer">
              <p>You're receiving this because you set a price alert for this product.</p>
              <p><a href="${unsubscribeUrl}">Unsubscribe</a> from price alerts</p>
            </div>
          </div>
        </body>
        </html>
      `,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send price alert email:', error);
    return false;
  }
}

interface PriceAlertParams {
  to: string;
  product: Product;
  targetPrice: number;
  currentPrice: number;
  unsubscribeUrl: string;
}
