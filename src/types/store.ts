// src/types/store.ts

// ─── API Wrapper ───────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  status: number;
  error: string;
  message: string;
  data: T;
  deviceId: string;
};

// ─── User ──────────────────────────────────────────────────────────────────────

export type Role = {
  name: string;
};

export type User = {
  id: number;
  createdDate: string;
  name: string;
  email: string;
  username: string;
  mobile: string;
  gender: string | null;
  token: string;
  webToken: string | null;
  onBoard: boolean;
  enable: boolean;
  profileImage: string | null;
  biometric: boolean;
  roles: Role[];
  stores: Store[];
};

// ─── Store ─────────────────────────────────────────────────────────────────────

export type Store = {
  id: string;
  username: string;
  name: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  theme: string;
  socialLinks: {
    instagram: string;
    whatsapp: string;
    facebook: string;
    twitter: string;
  };
  createdAt: string;
};

export type CreateStoreBody = {
  username: string;
  name: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  theme: string;
  socialLinks: {
    instagram: string;
    whatsapp: string;
    facebook: string;
    twitter: string;
  };
};

// ─── Product ───────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: string;
  imageUrl: string;
  images: string[];
  categoryIds: number[];
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
  tags: string[];
  slug: string;
  createdAt: string;
};

export type GetAllProducts = {
  products: Product[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
};

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type AuthRegisterParams = {
  name: string;
  email: string;
  mobile: string;
  username: string;
  password: string;
  image: string;
};

export type LoginParams = {
  username: string;
  password: string;
  deviceId: string;
  deviceType: string;
  deviceToken: string;
  deviceName: string;
  deviceModel: string;
  timestamp: number;
};

// ─── Query Params ──────────────────────────────────────────────────────────────

export type GetStoreProductsParams = {
  page?: number;
  pageSize?: number;
  category: number[];
  featured?: boolean;
};

export type GetProductParams = {
  username: string;
  page: number;
  pageSize: number;
  category: number[];
  featured: boolean;
};

export type GetProductBySlugParams = {
  username: string;
  slug: string;
};

// ─── Product CRUD ──────────────────────────────────────────────────────────────

export type CreateProductParams = {
  username: string;
};

export type CreateProductRequestBody = {
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: string;
  imageUrl: string;
  images: string[];
  categoryIds: number[];
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
  tags: string[];
  slug: string;
};

export type UpdateProductParams = {
  username: string;
  slug: string;
  data: UpdateProductRequestBody;
};

export type UpdateProductRequestBody = {
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: string;
  imageUrl: string;
  images: string[];
  categoryIds: number[];
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
  tags: string[];
  slug: string;
};

export type DeleteProductParams = {
  username: string;
  slug: string;
};

export type DeleteProductRequestBody = {
  username: string;
  slug: string;
};

export type CreateCategoriesBody = {
  name: string,
  slug: string,
  description: string,
  imageUrl: string,
  parentId: number,
  displayOrder: number
}