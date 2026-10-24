import tataSaltImg from '../assets/images/tata_salt_pack_1788550169673.jpg';
import surfExcelImg from '../assets/images/surf_excel_pack_1788550184912.jpg';
import parleGImg from '../assets/images/parle_g_biscuits_1788550197329.jpg';
import cadburyDairyMilkImg from '../assets/images/cadbury_dairy_milk_1788550211363.jpg';

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'P104': tataSaltImg,
  'P106': surfExcelImg,
  'P107': parleGImg,
  'P113': cadburyDairyMilkImg,
};

/**
 * Returns the best available image URL for a given product.
 * Prioritizes high-resolution generated product photography for
 * Tata Salt, Surf Excel, Parle-G, and Cadbury Dairy Milk.
 */
export function getProductImage(product?: { id?: string; productName?: string; imageUrl?: string } | null): string {
  if (!product) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80';
  }

  // 1. Direct match by ID if known
  if (product.id && PRODUCT_IMAGE_MAP[product.id]) {
    return PRODUCT_IMAGE_MAP[product.id];
  }

  const name = (product.productName || '').toLowerCase();

  // 2. Keyword matches for Tata Salt
  if (name.includes('tata salt') || (name.includes('salt') && !name.includes('chips'))) {
    return tataSaltImg;
  }

  // 3. Keyword matches for Surf Excel / Detergent
  if (name.includes('surf') || name.includes('excel') || name.includes('detergent') || name.includes('easy wash')) {
    return surfExcelImg;
  }

  // 4. Keyword matches for Parle / Biscuits
  if (name.includes('parle') || (name.includes('biscuit') && !name.includes('cookie'))) {
    return parleGImg;
  }

  // 5. Keyword matches for Cadbury Dairy Milk / Chocolate
  if (name.includes('cadbury') || name.includes('dairy milk') || name.includes('silk') || name.includes('chocolate')) {
    return cadburyDairyMilkImg;
  }

  // 6. Return existing URL if valid and not broken
  if (product.imageUrl && 
      !product.imageUrl.includes('photo-1610450942542') && 
      !product.imageUrl.includes('photo-1583947215259') && 
      !product.imageUrl.includes('photo-1558961312') && 
      !product.imageUrl.includes('photo-1549007994')) {
    return product.imageUrl;
  }

  // Fallback to general grocery thumbnail
  return product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80';
}
