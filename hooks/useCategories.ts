import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Category {
  name: string;
  count: number;
}

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the products content type ID
      const contentTypesResponse = await apiClient.get('/content/types');
      const productsType = contentTypesResponse.data.find(
        (ct: any) => ct.api_id === 'product' || ct.name === 'Product'
      );

      if (!productsType) {
        throw new Error('Products content type not found');
      }

      // Fetch all products to extract categories
      const params = new URLSearchParams({
        content_type_id: productsType.id,
        status: 'published',
        per_page: '100',
      });

      const response = await apiClient.get(`/content/entries?${params.toString()}`);
      const products = response.data.items || [];

      // Count products per category
      const categoryCount: Record<string, number> = {};
      products.forEach((product: any) => {
        const category = product.fields?.category;
        if (category) {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      const categoriesArray = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setCategories(categoriesArray);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
