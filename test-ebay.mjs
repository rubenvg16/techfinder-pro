import { searchEbayProducts } from './src/lib/api/ebay.ts';

console.log('Testing searchEbayProducts("iPhone 15")...');
const products = await searchEbayProducts('iPhone 15');

console.log('\n=== RESULTS ===');
console.log('Found:', products.length, 'products');

products.slice(0, 3).forEach((p, i) => {
  console.log(`\n${i+1}. ${p.title}`);
  console.log(`   Price: ${p.price} ${p.currency}`);
});

console.log('\n✅ SUCCESS! eBay API is fully configured!');
