'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronRight, ExternalLink, Image as ImageIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { resolveMediaUrl } from '@/lib/api/client';

// Check if an array looks like a media gallery (array of objects with url/src fields)
function isMediaGalleryArray(arr: any[]): boolean {
  if (arr.length === 0) return false;
  // Check if objects have url/src/image keys (case-insensitive, even if empty)
  return arr.every(item => {
    if (typeof item !== 'object' || item === null) return false;
    const keys = Object.keys(item).map(k => k.toLowerCase());
    return keys.includes('url') || keys.includes('src') || keys.includes('image');
  });
}

// Get the image URL from a media item (case-insensitive)
function getMediaUrl(item: any): string | null {
  if (typeof item !== 'object' || item === null) return null;
  // Check common URL field names (case-insensitive)
  for (const key of Object.keys(item)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'url' || lowerKey === 'src' || lowerKey === 'image') {
      const value = item[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  return null;
}

// Media Gallery Display Component for read-only mode
function MediaGalleryDisplay({ items, onCopy }: { items: any[], onCopy: (text: string) => void }) {
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {items.map((item, i) => {
        const rawUrl = getMediaUrl(item);
        const resolvedUrl = resolveMediaUrl(rawUrl);
        const alt = item.alt || item.title || item.name || `Image ${i + 1}`;
        const hasFailed = failedImages.has(i);
        
        return (
          <div 
            key={i} 
            className="group relative aspect-square bg-muted/50 rounded-lg border overflow-hidden hover:border-primary transition-colors"
          >
            {resolvedUrl && !hasFailed ? (
              <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                <img 
                  src={resolvedUrl}
                  alt={alt}
                  className="w-full h-full object-cover"
                  onError={() => {
                    setFailedImages(prev => new Set(prev).add(i));
                  }}
                />
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-muted-foreground">
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">{rawUrl ? 'Failed to load' : 'No URL'}</span>
              </div>
            )}
            {/* Alt text / label overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{alt}</p>
            </div>
            {/* Actions */}
            {rawUrl && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onCopy(rawUrl);
                  }}
                  className="p-1 bg-white/90 rounded hover:bg-white"
                  title="Copy URL"
                >
                  <Copy className="h-3 w-3 text-gray-700" />
                </button>
                <a 
                  href={resolvedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 bg-white/90 rounded hover:bg-white"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3 w-3 text-gray-700" />
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper component for displaying nested arrays nicely
function NestedArrayDisplay({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground italic">Empty</span>;
  }

  // Check if it's an array of simple values
  if (items.every(item => typeof item !== 'object')) {
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{String(item)}</span>
        ))}
      </div>
    );
  }

  // Array of objects - render as a list
  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {items.map((item, i) => (
        <div key={i} className="text-xs p-1.5 bg-muted/50 rounded">
          {typeof item === 'object' && item !== null ? (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {Object.entries(item).map(([k, v]) => (
                <span key={k}>
                  <span className="text-muted-foreground">{k}:</span>{' '}
                  {typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')) ? (
                    <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      {v.length > 30 ? v.substring(0, 30) + '...' : v}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span className="font-medium">{String(v)}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            String(item)
          )}
        </div>
      ))}
    </div>
  );
}

interface JsonFieldEditorProps {
  value: any;
  onChange: (value: any) => void;
  fieldName: string;
  readOnly?: boolean;
}

export function JsonFieldEditor({ value, onChange, fieldName, readOnly = false }: JsonFieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState<'visual' | 'raw'>('visual');
  const [rawValue, setRawValue] = useState('');
  const [rawError, setRawError] = useState('');

  useEffect(() => {
    setRawValue(JSON.stringify(value, null, 2) || '');
  }, [value]);

  const handleRawChange = (newRaw: string) => {
    setRawValue(newRaw);
    try {
      const parsed = JSON.parse(newRaw);
      setRawError('');
      onChange(parsed);
    } catch (e) {
      setRawError('Invalid JSON');
    }
  };

  // Helper to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Handle array of objects (like enabled_currencies or media galleries)
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    const isMediaGallery = isMediaGalleryArray(value);
    
    // In read-only mode with media gallery, show thumbnails
    if (readOnly && isMediaGallery) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <ImageIcon className="h-4 w-4 mr-1" />
              {value.length} {value.length === 1 ? 'image' : 'images'}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(editMode === 'visual' ? 'raw' : 'visual')}
            >
              {editMode === 'visual' ? 'Raw JSON' : 'Visual'}
            </Button>
          </div>
          
          {isExpanded && editMode === 'visual' && (
            <MediaGalleryDisplay items={value} onCopy={copyToClipboard} />
          )}
          
          {isExpanded && editMode === 'raw' && (
            <pre className="p-3 bg-muted rounded-lg overflow-auto text-xs font-mono max-h-48">
              {JSON.stringify(value, null, 2)}
            </pre>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm font-medium hover:text-primary"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {value.length} items
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(editMode === 'visual' ? 'raw' : 'visual')}
            >
              {editMode === 'visual' ? 'Raw JSON' : 'Visual'}
            </Button>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...value, {}])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            )}
          </div>
        </div>

        {isExpanded && editMode === 'visual' && (
          <div className="space-y-4">
            {value.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const newArray = [...value];
                        newArray.splice(index, 1);
                        onChange(newArray);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(item).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{key}</Label>
                      {readOnly ? (
                        <div className="text-sm p-2 bg-background rounded border">
                          {typeof val === 'boolean' 
                            ? (val ? '✓ Yes' : '✗ No') 
                            : typeof val === 'object' && val !== null
                              ? (Array.isArray(val) 
                                  ? <NestedArrayDisplay items={val} />
                                  : <pre className="text-xs overflow-auto">{JSON.stringify(val, null, 2)}</pre>)
                              : String(val)}
                        </div>
                      ) : (
                        <Input
                          value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                          onChange={(e) => {
                            const newArray = [...value];
                            let newVal: any = e.target.value;
                            // Try to preserve type
                            if (typeof val === 'number') {
                              newVal = parseFloat(e.target.value) || 0;
                            } else if (typeof val === 'boolean') {
                              newVal = e.target.value === 'true';
                            }
                            newArray[index] = { ...item, [key]: newVal };
                            onChange(newArray);
                          }}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  ))}
                  {!readOnly && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">+ Add field</Label>
                      <div className="flex gap-1">
                        <Input
                          placeholder="key"
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if (input.value) {
                                const newArray = [...value];
                                newArray[index] = { ...item, [input.value]: '' };
                                onChange(newArray);
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isExpanded && editMode === 'raw' && (
          <div className="space-y-2">
            <Textarea
              value={rawValue}
              onChange={(e) => handleRawChange(e.target.value)}
              readOnly={readOnly}
              rows={10}
              className="font-mono text-sm"
            />
            {rawError && <p className="text-xs text-destructive">{rawError}</p>}
          </div>
        )}
      </div>
    );
  }

  // Handle simple array (like enabled_locales)
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{value.length} items</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(editMode === 'visual' ? 'raw' : 'visual')}
            >
              {editMode === 'visual' ? 'Raw JSON' : 'Visual'}
            </Button>
          </div>
        </div>

        {editMode === 'visual' ? (
          <div className="flex flex-wrap gap-2">
            {value.map((item, index) => (
              <div key={index} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
                {readOnly ? (
                  <span className="text-sm">{String(item)}</span>
                ) : (
                  <Input
                    value={String(item)}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[index] = e.target.value;
                      onChange(newArray);
                    }}
                    className="h-6 w-20 text-sm border-0 bg-transparent p-0"
                  />
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const newArray = [...value];
                      newArray.splice(index, 1);
                      onChange(newArray);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => onChange([...value, ''])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={rawValue}
              onChange={(e) => handleRawChange(e.target.value)}
              readOnly={readOnly}
              rows={4}
              className="font-mono text-sm"
            />
            {rawError && <p className="text-xs text-destructive">{rawError}</p>}
          </div>
        )}
      </div>
    );
  }

  // Handle object (like social_links, analytics_ids)
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{entries.length} properties</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditMode(editMode === 'visual' ? 'raw' : 'visual')}
          >
            {editMode === 'visual' ? 'Raw JSON' : 'Visual'}
          </Button>
        </div>

        {editMode === 'visual' ? (
          <div className="space-y-2">
            {entries.map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-1/3">
                  {readOnly ? (
                    <span className="text-sm font-medium">{key}</span>
                  ) : (
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newObj = { ...value };
                        delete newObj[key];
                        newObj[e.target.value] = val;
                        onChange(newObj);
                      }}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                <div className="flex-1">
                  {readOnly ? (
                    <span className="text-sm text-muted-foreground">{String(val)}</span>
                  ) : (
                    <Input
                      value={String(val ?? '')}
                      onChange={(e) => {
                        onChange({ ...value, [key]: e.target.value });
                      }}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      const newObj = { ...value };
                      delete newObj[key];
                      onChange(newObj);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...value, '': '' })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Property
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={rawValue}
              onChange={(e) => handleRawChange(e.target.value)}
              readOnly={readOnly}
              rows={6}
              className="font-mono text-sm"
            />
            {rawError && <p className="text-xs text-destructive">{rawError}</p>}
          </div>
        )}
      </div>
    );
  }

  // Fallback for primitives or null
  return (
    <Textarea
      value={rawValue}
      onChange={(e) => handleRawChange(e.target.value)}
      readOnly={readOnly}
      rows={4}
      className="font-mono text-sm"
    />
  );
}
