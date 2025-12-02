'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { contentApi, searchApi } from '@/lib/api';
import { ContentEntry, ContentType, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<PaginatedResponse<ContentEntry> | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(searchParams?.get('content_type_id') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadContentTypes = useCallback(async () => {
    try {
      const data = await contentApi.getContentTypes();
      setContentTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load content types:', err);
      // Set empty array on error so UI shows empty state
      setContentTypes([]);
    }
  }, []);

  const handleClearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params: any = { page: currentPage, per_page: 20 };
      
      if (selectedType !== 'all') {
        params.content_type_id = selectedType;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const data = await contentApi.getContentEntries(params);
      setContent(data);
    } catch (err: any) {
      console.error('Error loading content:', err);
      // Only show error if it's not a 404 or empty response
      if (err.response?.status !== 404) {
        setError('Failed to load content');
      } else {
        // Set empty content for 404 to show empty state
        setContent({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedStatus, currentPage]);

  useEffect(() => {
    loadContentTypes();
  }, [loadContentTypes]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, just reload content
      loadContent();
      return;
    }

    try {
      setIsLoading(true);
      const params: any = { q: searchQuery, limit: 20 };
      
      if (selectedType !== 'all') {
        params.content_type_id = selectedType;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const searchResults = await searchApi.search(params);
      
      // Convert search results to content format
      setContent({
        items: searchResults.results.map(result => ({
          id: result.id,
          content_type_id: result.content_type_id,
          slug: result.slug,
          status: result.status as any,
          content_data: result.content_data,
          version: 1,
          author_id: '',
          created_at: '',
          updated_at: '',
        })),
        total: searchResults.total,
        page: 1,
        page_size: 20,
        total_pages: Math.ceil(searchResults.total / 20),
      });
    } catch (error) {
      console.error('Search failed:', error);
      // Fall back to regular content loading
      loadContent();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage your content entries
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/content/new">Create Content</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  Search
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Always render the grid container for test compatibility */}
      <div className="grid gap-4" role="grid" data-testid="content-list">
        {content && content.items.length > 0 ? (
          content.items.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {entry.content_data?.title || entry.slug}
                    </CardTitle>
                    <CardDescription>
                      {entry.content_type?.name || 'Unknown Type'} • {getStatusBadge(entry.status)}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/content/${entry.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardHeader>
              {entry.content_data?.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.content_data.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-6 mb-6">
                <span className="text-6xl">📝</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-lg">
                {selectedType !== 'all' || selectedStatus !== 'all' || searchQuery ? (
                  <>
                    No content matches your current filters. Try adjusting your search criteria or{' '}
                    <button
                      onClick={handleClearFilters}
                      className="text-primary underline hover:no-underline"
                    >
                      clearing all filters
                    </button>
                    .
                  </>
                ) : contentTypes.length === 0 ? (
                  <>
                    You need to create a content type first before you can add content.{' '}
                    <Link href="/dashboard/content-types/builder" className="text-primary underline hover:no-underline">
                      Create a content type
                    </Link>{' '}
                    to get started.
                  </>
                ) : (
                  'Get started by creating your first content entry. Content entries are instances of your content types.'
                )}
              </p>
              {contentTypes.length > 0 && (
                <Button asChild size="lg">
                  <Link href="/dashboard/content/new">Create Your First Content</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {content && content.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {content.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === content.total_pages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
