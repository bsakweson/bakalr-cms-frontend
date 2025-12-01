import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Collection {
  id: string;
  slug: string;
  title: string;
  fields: {
    name: string;
    description?: string;
    image_url?: string;
    products?: number[]; // Product IDs
  };
}

interface UseCollectionsResult {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCollections(): UseCollectionsResult {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the collections content type ID
      const contentTypesResponse = await apiClient.get('/content/types');
      const collectionsType = contentTypesResponse.data.find(
        (ct: any) => ct.api_id === 'collection' || ct.name === 'Collection'
      );

      if (!collectionsType) {
        throw new Error('Collections content type not found');
      }

      const params = new URLSearchParams({
        content_type_id: collectionsType.id,
        status: 'published',
        per_page: '50',
      });

      const response = await apiClient.get(`/content/entries?${params.toString()}`);
      setCollections(response.data.items || []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.response?.data?.message || 'Failed to load collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
  };
}

export function useCollection(slug: string) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/content/entries/${slug}`);
      setCollection(response.data);
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.response?.data?.message || 'Collection not found');
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCollection();
    }
  }, [slug]);

  return {
    collection,
    loading,
    error,
    refetch: fetchCollection,
  };
}
