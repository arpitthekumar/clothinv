/**
 * Maps frontend camelCase field names to database column names.
 * Your Supabase table currently stores most columns in camelCase and
 * only a few in snake_case (e.g. buying_price, deleted_at). This helper
 * ensures we send the right field names without requiring DB changes.
 */

export function mapProductToDb(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const dbProduct: any = {};
  
  // Fields that already match the column names in Supabase (camelCase is fine)
  const directFields = [
    'id',
    'name',
    'sku',
    'categoryId',
    'description',
    'price',
    'size',
    'stock',
    'minStock',
    'barcode',
    'createdAt',
    'updatedAt',
    'deleted',
    'deleted_at',
  ];
  for (const field of directFields) {
    if (field in product && product[field] !== undefined) {
      dbProduct[field] = product[field];
    }
  }

  if ('buyingPrice' in product) {
    const val = product.buyingPrice;
    if (val !== undefined && val !== null && val !== '') {
      dbProduct['buying_price'] = val;
    }
  }

  return dbProduct;
}

export function mapProductFromDb(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const mapped: any = { ...product };

  if ('category_id' in mapped && mapped.category_id !== undefined) {
    mapped.categoryId = mapped.category_id;
    delete mapped.category_id;
  }

  if ('min_stock' in mapped && mapped.min_stock !== undefined) {
    mapped.minStock = mapped.min_stock;
    delete mapped.min_stock;
  }

  if ('buying_price' in mapped && mapped.buying_price !== undefined) {
    mapped.buyingPrice = mapped.buying_price;
    delete mapped.buying_price;
  }

  if ('created_at' in mapped && mapped.created_at !== undefined) {
    mapped.createdAt = mapped.created_at;
    delete mapped.created_at;
  }

  if ('updated_at' in mapped && mapped.updated_at !== undefined) {
    mapped.updatedAt = mapped.updated_at;
    delete mapped.updated_at;
  }

  if ('deleted_at' in mapped && mapped.deleted_at !== undefined) {
    mapped.deletedAt = mapped.deleted_at;
    delete mapped.deleted_at;
  }

  return mapped;
}

