'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { contentApi } from '@/lib/api';
import { ContentEntry, ContentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ContentPreviewPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : null;

  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await contentApi.getContentEntry(id);
      setEntry(data);
      
      if (data.content_type_id) {
        const type = await contentApi.getContentType(data.content_type_id);
        setContentType(type);
      }
    } catch (err: any) {
      setError('Failed to load content');
      console.error(err);
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

  const renderFieldValue = (key: string, value: any, field?: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">Empty</span>;
      }
      return (
        <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-48">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-48">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // String or number
    const strValue = String(value);
    if (strValue.length > 200) {
      return (
        <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
          {strValue}
        </div>
      );
    }

    return <span>{strValue}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading preview...</div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-destructive">{error || 'Content not found'}</div>
      </div>
    );
  }

  const contentData = entry.data || entry.content_data || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Preview Banner */}
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md mb-6 flex items-center justify-between">
          <span className="font-medium">📖 Preview Mode</span>
          <span className="text-sm">This is a preview of your content</span>
        </div>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {contentData.title || contentData.site_name || contentData.name || entry.slug}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {contentType?.name || 'Unknown Type'} • {getStatusBadge(entry.status)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Slug:</span>{' '}
                <code className="bg-muted px-2 py-0.5 rounded">{entry.slug}</code>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span> {entry.version}
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                {new Date(entry.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{' '}
                {new Date(entry.updated_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Content Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(contentData).map(([key, value]) => (
                <div key={key} className="border-b pb-4 last:border-0 last:pb-0">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                  <div className="mt-1">
                    {renderFieldValue(key, value)}
                  </div>
                </div>
              ))}
              {Object.keys(contentData).length === 0 && (
                <p className="text-muted-foreground italic">No content fields</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
