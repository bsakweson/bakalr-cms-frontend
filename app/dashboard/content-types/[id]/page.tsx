'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { contentApi } from '@/lib/api';
import { ContentType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ContentTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContentType = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await contentApi.getContentType(id);
      setContentType(data);
    } catch (err: any) {
      setError('Failed to load content type');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadContentType();
    }
  }, [id, loadContentType]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content type? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteContentType(id);
      router.push('/dashboard/content-types');
    } catch (err: any) {
      toast.error('Failed to delete content type: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading content type...</div>
      </div>
    );
  }

  if (error || !contentType) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-destructive">{error || 'Content type not found'}</div>
        <Button asChild>
          <Link href="/dashboard/content-types">Back to Content Types</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/content-types">← Back</Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{contentType.name}</h1>
          <p className="text-muted-foreground">{contentType.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/content-types/${id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about this content type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">{contentType.name}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">API ID</label>
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline">{contentType.api_id}</Badge>
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground">
                {contentType.description || 'No description provided'}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground">
                {new Date(contentType.created_at).toLocaleString()}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Last Updated</label>
              <p className="text-sm text-muted-foreground">
                {new Date(contentType.updated_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schema / Fields</CardTitle>
            <CardDescription>
              Field definitions for content entries of this type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentType.fields && contentType.fields.length > 0 ? (
              <div className="space-y-4">
                {contentType.fields.map((field) => (
                  <div key={field.name} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{field.name}</h4>
                        {field.help_text && (
                          <p className="text-sm text-muted-foreground">{field.help_text}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{field.type}</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {field.required && (
                        <Badge variant="outline">Required</Badge>
                      )}
                      {field.unique && (
                        <Badge variant="outline">Unique</Badge>
                      )}
                      {field.localized && (
                        <Badge variant="outline">Localized</Badge>
                      )}
                    </div>
                    {field.default !== null && field.default !== undefined && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Default: {JSON.stringify(field.default)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-muted-foreground">No fields defined yet</p>
                <p className="text-sm text-muted-foreground">
                  Edit this content type to add fields
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage this content type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/content?content_type_id=${id}`}>
                View Content Entries
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/content/new?content_type_id=${id}`}>
                Create New Entry
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/content-types/${id}/edit`}>
                Edit Content Type
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
