'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { contentApi } from '@/lib/api';
import { ContentEntry, ContentType, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentViewDialog, ContentEditDialog } from '@/components/content';
import { useSearch } from '@/hooks/use-search';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<PaginatedResponse<ContentEntry> | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Filters
  const [selectedType, setSelectedType] = useState<string>(searchParams?.get('content_type_id') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search hook - uses Meilisearch API
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    isSearchMode,
    total: searchTotal,
    error: searchError,
    clearSearch,
  } = useSearch({
    contentTypeId: selectedType !== 'all' ? selectedType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    limit: 50,
    debounceMs: 300,
  });

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
    clearSearch();
    setCurrentPage(1);
  };

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params: any = { page: currentPage, page_size: 5 };
      
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
        setContent({ items: [], total: 0, page: 1, page_size: 20, pages: 0 });
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

  // Convert search results to ContentEntry format for display
  const searchResultsAsEntries = useMemo((): ContentEntry[] => {
    if (!isSearchMode || searchResults.length === 0) return [];
    
    return searchResults.map((result) => {
      const contentData = typeof result.content_data === 'string' 
        ? JSON.parse(result.content_data || '{}') 
        : (result.content_data || {});
      
      return {
        id: result.id,
        slug: result.slug,
        status: result.status as 'draft' | 'published' | 'archived',
        content_type_id: result.content_type_id,
        // Create a minimal content_type object that satisfies display needs
        content_type: result.content_type_name ? {
          id: result.content_type_id,
          name: result.content_type_name,
          api_id: '',
          fields: [],
          is_active: true,
          organization_id: '',
          created_at: '',
          updated_at: '',
        } as ContentType : undefined,
        content_data: contentData,
        data: contentData,
        version: 1,
        author_id: '',
        created_at: result.created_at || '',
        updated_at: result.updated_at || '',
      };
    });
  }, [searchResults, isSearchMode]);

  // Determine which content to display
  const displayContent = isSearchMode ? searchResultsAsEntries : (content?.items || []);

  // Handle clicking on a content entry - fetch full entry if from search results
  const handleEntryClick = async (entry: ContentEntry) => {
    // If this is from search results, fetch the full entry
    if (isSearchMode) {
      try {
        const fullEntry = await contentApi.getContentEntry(entry.id);
        setSelectedEntry(fullEntry);
      } catch (err) {
        console.error('Failed to fetch entry:', err);
        // Fallback to the search result data
        setSelectedEntry(entry);
      }
    } else {
      setSelectedEntry(entry);
    }
    setViewDialogOpen(true);
  };

  // Handle switching from view to edit mode
  const handleEditClick = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  // Handle going back from edit to view mode
  const handleBackToView = () => {
    setEditDialogOpen(false);
    setViewDialogOpen(true);
  };

  // Handle save completion
  const handleSaved = (updatedEntry: ContentEntry) => {
    setSelectedEntry(updatedEntry);
    setEditDialogOpen(false);
    setViewDialogOpen(true);
    // Refresh the list
    loadContent();
  };

  // Close all dialogs
  const handleCloseDialogs = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedEntry(null);
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
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search content..."
                isLoading={isSearching}
              />
              {isSearchMode && !isSearching && (
                <p className="text-xs text-muted-foreground">
                  {searchTotal} result{searchTotal !== 1 ? 's' : ''} found
                </p>
              )}
              {searchError && (
                <p className="text-xs text-destructive">{searchError}</p>
              )}
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
        {displayContent.length > 0 ? (
          displayContent.map((entry) => (
            <Card 
              key={entry.id} 
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => handleEntryClick(entry)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      {entry.data?.title || entry.data?.site_name || entry.data?.name || entry.content_data?.title || entry.slug}
                    </CardTitle>
                    <CardDescription>
                      {entry.content_type?.name || 'Unknown Type'} • {getStatusBadge(entry.status)}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntry(entry);
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </CardHeader>
              {(entry.data?.description || entry.data?.tagline || entry.content_data?.description) && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.data?.description || entry.data?.tagline || entry.content_data?.description}
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
                {selectedType !== 'all' || selectedStatus !== 'all' || isSearchMode ? (
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

      {/* Pagination - show when not searching and content exists */}
      {!isSearchMode && content && content.items.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * (content.page_size || 10)) + 1} - {Math.min(currentPage * (content.page_size || 10), content.total)} of {content.total} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {content.pages || content.total_pages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= (content.pages || content.total_pages || 1)}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <ContentViewDialog
        entry={selectedEntry}
        open={viewDialogOpen}
        onClose={handleCloseDialogs}
        onEdit={handleEditClick}
      />

      {/* Edit Dialog */}
      <ContentEditDialog
        entry={selectedEntry}
        open={editDialogOpen}
        onClose={handleCloseDialogs}
        onSaved={handleSaved}
        onBack={handleBackToView}
      />
    </div>
  );
}
