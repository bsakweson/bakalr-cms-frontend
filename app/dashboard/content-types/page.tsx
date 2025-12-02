'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contentApi } from '@/lib/api';
import { ContentType, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function ContentTypesPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadContentTypes();
  }, []);

  const loadContentTypes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await contentApi.getContentTypes();
      setContentTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading content types:', err);
      // Only show error if it's not a 404 or empty response
      if (err.response?.status !== 404) {
        setError('Failed to load content types');
      } else {
        setContentTypes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (id: string, name: string) => {
    setTypeToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      await contentApi.deleteContentType(typeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      loadContentTypes(); // Reload the list
    } catch (err: any) {
      setError('Failed to delete content type: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading content types...</div>
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Types</h1>
          <p className="text-muted-foreground">
            Define and manage your content models
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/content-types/builder">
            <Plus className="h-4 w-4 mr-2" />
            Create Content Type
          </Link>
        </Button>
      </div>

      {contentTypes && contentTypes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contentTypes.map((type) => (
            <Card key={type.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{type.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {type.api_id}
                      </Badge>
                    </div>
                    {type.description && (
                      <CardDescription className="line-clamp-2">
                        {type.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/content-types/${type.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/content-types/builder?id=${type.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(type.id, type.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fields</span>
                    <Badge variant="secondary">
                      {type.fields?.length || 0}
                    </Badge>
                  </div>
                  {type.fields && type.fields.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {type.fields.slice(0, 5).map((field) => (
                        <Badge key={field.name} variant="outline" className="text-xs">
                          {field.name}
                        </Badge>
                      ))}
                      {type.fields.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{type.fields.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-gray-100 p-6 mb-6">
              <span className="text-6xl">📋</span>
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Content Types Yet</h3>
            <p className="text-muted-foreground text-center mb-2 max-w-lg">
              Content types define the structure of your content. Think of them as blueprints or templates.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-lg">
              For example, create a "Product" content type with fields like name, price, and description, or a "Blog Post" type with title, author, and body fields.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/content-types/builder">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Content Type
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {contentTypes && contentTypes.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {contentTypes.length} content type{contentTypes.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be undone and will affect all content entries of this type.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Content Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
