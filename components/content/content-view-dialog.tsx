'use client';

import { useState, useEffect } from 'react';
import { ContentEntry, ContentType } from '@/types';
import { contentApi } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, X, Copy, ExternalLink, Calendar, User, Hash, Image as ImageIcon, FileIcon, Play, Music } from 'lucide-react';
import { JsonFieldEditor } from './json-field-editor';
import { toast } from 'sonner';

interface ContentViewDialogProps {
  entry: ContentEntry | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ContentViewDialog({ entry, open, onClose, onEdit }: ContentViewDialogProps) {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (entry?.content_type_id && open) {
      loadContentType(entry.content_type_id);
    }
  }, [entry?.content_type_id, open]);

  const loadContentType = async (typeId: string) => {
    try {
      setIsLoading(true);
      const data = await contentApi.getContentType(typeId);
      setContentType(data);
    } catch (err) {
      console.error('Failed to load content type:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!entry) return null;

  const data = entry.data || entry.content_data || {};
  const displayTitle = data.title || data.site_name || data.name || entry.slug;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderFieldValue = (key: string, value: any, fieldDef?: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    if (value === '') {
      return <span className="text-muted-foreground italic">Empty</span>;
    }

    const fieldType = fieldDef?.type || (typeof value);

    // Boolean
    if (typeof value === 'boolean' || fieldType === 'boolean') {
      return (
        <span className={value ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      );
    }

    // Array or Object - use JsonFieldEditor in read-only mode
    if (typeof value === 'object') {
      return <JsonFieldEditor value={value} onChange={() => {}} fieldName={key} readOnly />;
    }

    // URL
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline flex items-center gap-1"
        >
          {value.length > 50 ? value.substring(0, 50) + '...' : value}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    // Image URL
    if (typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      const resolvedUrl = resolveMediaUrl(value);
      return (
        <div className="space-y-2">
          <img src={resolvedUrl} alt={key} className="max-w-xs max-h-32 object-cover rounded border" />
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            {value}
          </a>
        </div>
      );
    }

    // Email
    if (typeof value === 'string' && value.includes('@') && !value.includes(' ')) {
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {value}
        </a>
      );
    }

    // Long text
    if (typeof value === 'string' && value.length > 200) {
      return (
        <div className="max-h-32 overflow-y-auto text-sm whitespace-pre-wrap">
          {value}
        </div>
      );
    }

    // Default - plain text
    return <span className="text-sm">{String(value)}</span>;
  };

  // Get fields from content type
  const fields = contentType?.fields || [];
  const fieldMap = fields.reduce((acc: Record<string, any>, field: any) => {
    acc[field.name] = field;
    return acc;
  }, {});

  // Get all keys from data, sorted by field order if available
  const dataKeys = Object.keys(data);
  const orderedKeys = fields.length > 0
    ? [...fields.map((f: any) => f.name).filter((k: string) => k in data), ...dataKeys.filter(k => !fieldMap[k])]
    : dataKeys;

  // Extract media items from content data
  const extractMediaItems = (): { key: string; url: string; type: 'image' | 'video' | 'audio' | 'file'; label: string }[] => {
    const mediaItems: { key: string; url: string; type: 'image' | 'video' | 'audio' | 'file'; label: string }[] = [];
    
    const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(url) || url.includes('/image');
    const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
    const isAudioUrl = (url: string) => /\.(mp3|wav|ogg|m4a|aac)$/i.test(url);
    
    const processValue = (key: string, value: any, parentLabel: string = '') => {
      if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'))) {
        const fieldDef = fieldMap[key];
        const label = parentLabel || fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        
        if (isImageUrl(value) || fieldDef?.type === 'image' || fieldDef?.type === 'media') {
          mediaItems.push({ key, url: value, type: 'image', label });
        } else if (isVideoUrl(value)) {
          mediaItems.push({ key, url: value, type: 'video', label });
        } else if (isAudioUrl(value)) {
          mediaItems.push({ key, url: value, type: 'audio', label });
        } else if (fieldDef?.type === 'file') {
          mediaItems.push({ key, url: value, type: 'file', label });
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (typeof item === 'string') {
            const fieldDef = fieldMap[key];
            const label = fieldDef?.label || key.replace(/_/g, ' ');
            processValue(`${key}[${idx}]`, item, `${label} ${idx + 1}`);
          } else if (typeof item === 'object' && item !== null) {
            // Handle array of objects with url/src fields
            if (item.url) processValue(`${key}[${idx}].url`, item.url, item.title || item.name || `${key} ${idx + 1}`);
            if (item.src) processValue(`${key}[${idx}].src`, item.src, item.title || item.name || `${key} ${idx + 1}`);
            if (item.image) processValue(`${key}[${idx}].image`, item.image, item.title || item.name || `${key} ${idx + 1}`);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          processValue(`${key}.${nestedKey}`, nestedValue);
        });
      }
    };
    
    Object.entries(data).forEach(([key, value]) => processValue(key, value));
    
    return mediaItems;
  };

  const mediaItems = extractMediaItems();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] md:w-[85vw] md:max-w-[85vw] lg:w-[75vw] lg:max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold">{displayTitle}</DialogTitle>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {entry.slug}
                </span>
                <span>•</span>
                <span>{contentType?.name || 'Loading...'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
              {entry.status}
            </span>
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="fields" className="h-full">
            <div className="px-6 pt-4 border-b">
              <TabsList>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                {mediaItems.length > 0 && (
                  <TabsTrigger value="media" className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Media ({mediaItems.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="fields" className="p-6 m-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-muted-foreground">Loading fields...</span>
                </div>
              ) : orderedKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <span>No data available</span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {orderedKeys.map((key) => {
                    const fieldDef = fieldMap[key];
                    const value = data[key];
                    const isComplex = typeof value === 'object' && value !== null;

                    return (
                      <div 
                        key={key} 
                        className={`space-y-2 ${isComplex ? 'md:col-span-2' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                          {fieldDef?.type && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {fieldDef.type}
                            </Badge>
                          )}
                          {fieldDef?.required && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                          <button
                            onClick={() => copyToClipboard(typeof value === 'object' ? JSON.stringify(value) : String(value))}
                            className="ml-auto text-muted-foreground hover:text-foreground"
                            title="Copy value"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg border">
                          {renderFieldValue(key, value, fieldDef)}
                        </div>
                        {fieldDef?.help_text && (
                          <p className="text-xs text-muted-foreground">{fieldDef.help_text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Media Gallery Tab */}
            {mediaItems.length > 0 && (
              <TabsContent value="media" className="p-6 m-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaItems.map((item, index) => (
                    <div 
                      key={`${item.key}-${index}`}
                      className="group relative aspect-square bg-muted/30 rounded-lg border overflow-hidden hover:border-primary transition-colors"
                    >
                      {item.type === 'image' ? (
                        <a href={resolveMediaUrl(item.url)} target="_blank" rel="noopener noreferrer" className="block h-full">
                          <img 
                            src={resolveMediaUrl(item.url)} 
                            alt={item.label}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : item.type === 'video' ? (
                        <a href={resolveMediaUrl(item.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full bg-black/10">
                          <Play className="h-10 w-10 text-muted-foreground" />
                        </a>
                      ) : item.type === 'audio' ? (
                        <a href={resolveMediaUrl(item.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full">
                          <Music className="h-10 w-10 text-muted-foreground" />
                        </a>
                      ) : (
                        <a href={resolveMediaUrl(item.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full">
                          <FileIcon className="h-10 w-10 text-muted-foreground" />
                        </a>
                      )}
                      {/* Label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs truncate">{item.label}</p>
                      </div>
                      {/* Open link button */}
                      <a 
                        href={resolveMediaUrl(item.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3 w-3 text-gray-700" />
                      </a>
                    </div>
                  ))}
                </div>
                {/* Media list view */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">All Media URLs</h4>
                  <div className="space-y-2">
                    {mediaItems.map((item, index) => (
                      <div 
                        key={`list-${item.key}-${index}`}
                        className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg text-sm"
                      >
                        <div className="shrink-0">
                          {item.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                          {item.type === 'video' && <Play className="h-4 w-4 text-purple-500" />}
                          {item.type === 'audio' && <Music className="h-4 w-4 text-green-500" />}
                          {item.type === 'file' && <FileIcon className="h-4 w-4 text-gray-500" />}
                        </div>
                        <span className="font-medium min-w-[120px] text-muted-foreground">{item.label}</span>
                        <a 
                          href={resolveMediaUrl(item.url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate flex-1"
                        >
                          {item.url}
                        </a>
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="shrink-0 p-1 hover:bg-muted rounded"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="metadata" className="p-6 m-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Hash className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">ID</span>
                  </div>
                  <code className="text-sm font-mono">{entry.id}</code>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span className="text-xs font-medium uppercase">Slug</span>
                  </div>
                  <code className="text-sm font-mono">{entry.slug}</code>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span className="text-xs font-medium uppercase">Version</span>
                  </div>
                  <span className="text-sm">{entry.version || 1}</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Created</span>
                  </div>
                  <span className="text-sm">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Updated</span>
                  </div>
                  <span className="text-sm">
                    {entry.updated_at ? new Date(entry.updated_at).toLocaleString() : '-'}
                  </span>
                </div>
                {entry.published_at && (
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">Published</span>
                    </div>
                    <span className="text-sm">
                      {new Date(entry.published_at).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <span className="text-xs font-medium uppercase">Content Type</span>
                  </div>
                  <span className="text-sm">{contentType?.name || '-'}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="raw" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Raw entry data</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm font-mono max-h-[60vh]">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
