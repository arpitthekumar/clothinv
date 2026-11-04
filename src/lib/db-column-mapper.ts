/**
 * Maps frontend camelCase field names to database column names (snake_case in PostgreSQL).
 */

export function mapUserToDb(user: any): any {
  if (!user || typeof user !== 'object') {
    return user;
  }
  const dbUser: any = {};
  if ('id' in user && user.id !== undefined) dbUser.id = user.id;
  if ('username' in user && user.username !== undefined) dbUser.username = user.username;
  if ('password' in user && user.password !== undefined) dbUser.password = user.password;
  if ('role' in user && user.role !== undefined) dbUser.role = user.role;
  if ('fullName' in user && user.fullName !== undefined) dbUser.full_name = user.fullName;
  if ('full_name' in user && user.full_name !== undefined) dbUser.full_name = user.full_name;
  if ('createdAt' in user && user.createdAt !== undefined) dbUser.created_at = user.createdAt;
  if ('created_at' in user && user.created_at !== undefined) dbUser.created_at = user.created_at;

  return dbUser;
}

export function mapUserFromDb(user: any): any {
  if (!user || typeof user !== "object") {
    return user;
  }
  const u = { ...user };
  if (u.full_name !== undefined && u.fullName === undefined) {
    u.fullName = u.full_name;
    delete u.full_name;
  }
  if (u.created_at !== undefined && u.createdAt === undefined) {
    u.createdAt =
      typeof u.created_at === "string" ? new Date(u.created_at) : u.created_at;
    delete u.created_at;
  }
  return u;
}

export function mapProductToDb(product: any): any {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const dbProduct: any = {};
  
  const mapping: Record<string, string> = {
    id: 'id',
    name: 'name',
    sku: 'sku',
    categoryId: 'category_id',
    category_id: 'category_id',
    description: 'description',
    price: 'price',
    buyingPrice: 'buying_price',
    buying_price: 'buying_price',
    size: 'size',
    stock: 'stock',
    minStock: 'min_stock',
    min_stock: 'min_stock',
    barcode: 'barcode',
    isBargainable: 'is_bargainable',
    is_bargainable: 'is_bargainable',
    minPrice: 'min_price',
    min_price: 'min_price',
    deleted: 'deleted',
    deletedAt: 'deleted_at',
    deleted_at: 'deleted_at',
    createdAt: 'created_at',
    created_at: 'created_at',
    updatedAt: 'updated_at',
    updated_at: 'updated_at',
  };

  for (const [key, value] of Object.entries(product)) {
    if (value !== undefined) {
      const targetKey = mapping[key] || key;
      dbProduct[targetKey] = value;
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

  if ('is_bargainable' in mapped && mapped.is_bargainable !== undefined) {
    mapped.isBargainable = mapped.is_bargainable;
    delete mapped.is_bargainable;
  }

  if ('min_price' in mapped && mapped.min_price !== undefined) {
    mapped.minPrice = mapped.min_price;
    delete mapped.min_price;
  }

  return mapped;
}
