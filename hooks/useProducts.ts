import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  search?: string;
  locale?: string;
}

interface Product {
  id: string;
  slug: string;
  title: string;
  status: string;
  data: {
    name: string;
    description: string;
    price: number;
    category: string;
    brand: string;
    images?: string[];
    stock_quantity?: number;
    specifications?: Record<string, any>;
    sku?: string;
    in_stock?: boolean;
  };
  seo_data?: any;
  published_at?: string;
}

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  refetch: () => void;
}

export function useProducts(
  filters: ProductFilters = {},
  page: number = 1,
  perPage: number = 12
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 12,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get content type ID from environment or lookup dynamically
      let contentTypeId = process.env.NEXT_PUBLIC_PRODUCTS_CONTENT_TYPE_ID;
      
      if (!contentTypeId) {
        // First, get the products content type ID by api_id
        const contentTypesResponse = await apiClient.get('/content/types');
        const productsType = contentTypesResponse.data.find(
          (ct: any) => ct.api_id === 'product' || ct.name === 'Product'
        );

        if (!productsType) {
          throw new Error('Products content type not found. Please create a Product content type.');
        }
        contentTypeId = productsType.id;
      }

      if (!contentTypeId) {
        throw new Error('Products content type ID is not configured.');
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        content_type_id: contentTypeId, // Use dynamic or env UUID
        status: 'published',
      });

      // Add filters
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.brand) {
        params.append('brand', filters.brand);
      }
      if (filters.locale) {
        params.append('locale', filters.locale);
      }

      const response = await apiClient.get(`/content/entries?${params.toString()}`);
      
      // Filter by price range on client side if needed
      let filteredProducts = response.data.items || [];
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter((product: Product) => {
          const price = product.data.price || 0;
          if (filters.minPrice !== undefined && price < filters.minPrice) return false;
          if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
          return true;
        });
      }

      setProducts(filteredProducts);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        per_page: response.data.page_size,
        total_pages: response.data.pages,
        has_next: response.data.page < response.data.pages,
        has_prev: response.data.page > 1,
      });
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.message || err.response?.data?.detail || 'Failed to load products';
      
      // Provide helpful error messages
      if (errorMessage.includes('content type not found')) {
        setError('No products available. Please log in to the admin dashboard and create a Product content type.');
      } else if (err.response?.status === 401) {
        setError('Please log in to view products.');
      } else {
        setError(errorMessage);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, perPage, filters.category, filters.brand, filters.search, filters.minPrice, filters.maxPrice, filters.locale]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
}
