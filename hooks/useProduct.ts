import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Product {
  id: string;
  slug: string;
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
    sale_price?: number;
    is_featured?: boolean;
  };
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface Translation {
  locale: string;
  translated_data: Record<string, any>;
}

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  translation: Translation | null;
  refetch: () => void;
}

export function useProduct(
  idOrSlug: string | number,
  locale?: string
): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      let productData: Product | null = null;

      // Check if idOrSlug is a number (ID) or string (slug)
      if (typeof idOrSlug === 'number' || /^\d+$/.test(idOrSlug.toString())) {
        // Fetch directly by ID
        const response = await apiClient.get(`/content/entries/${idOrSlug}`);
        console.log('Product by ID:', response.data);
        productData = response.data;
      } else {
        // Search by slug
        const searchResponse = await apiClient.get('/content/entries', {
          params: {
            slug: idOrSlug,
            per_page: 1,
          }
        });
        
        console.log('Product search response:', searchResponse.data);
        
        if (searchResponse.data?.items && searchResponse.data.items.length > 0) {
          productData = searchResponse.data.items[0];
          console.log('Found product:', productData);
        } else {
          throw new Error('Product not found');
        }
      }

      setProduct(productData);

      // Fetch translation if locale is specified
      if (locale && locale !== 'en' && productData?.id) {
        try {
          const translationResponse = await apiClient.get(
            `/translation/entry/${productData.id}/locale/${locale}`
          );
          setTranslation(translationResponse.data);
        } catch (translationErr) {
          console.warn(`Translation not available for locale: ${locale}`);
          setTranslation(null);
        }
      } else {
        setTranslation(null);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Product not found');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idOrSlug) {
      fetchProduct();
    }
  }, [idOrSlug, locale]);

  return {
    product,
    loading,
    error,
    translation,
    refetch: fetchProduct,
  };
}
