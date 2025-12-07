'use client';

import { useState, useEffect } from 'react';
import { ContentEntry, ContentType } from '@/types';
import { contentApi } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X, ArrowLeft, Loader2, ImageIcon } from 'lucide-react';
import { JsonFieldEditor } from './json-field-editor';
import { NavigationEditor } from './navigation-editor';
import { MediaGalleryEditor } from './media-gallery-editor';
import MediaPickerModal from '@/components/media-picker-modal';
import { Media } from '@/types';
import { toast } from 'sonner';

interface ContentEditDialogProps {
  entry: ContentEntry | null;
  open: boolean;
  onClose: () => void;
  onSaved: (entry: ContentEntry) => void;
  onBack?: () => void;
}

export function ContentEditDialog({ entry, open, onClose, onSaved, onBack }: ContentEditDialogProps) {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [mediaPickerField, setMediaPickerField] = useState<string | null>(null);
  const [mediaPickerFileType, setMediaPickerFileType] = useState<'image' | 'video' | 'audio' | 'document' | undefined>();

  useEffect(() => {
    if (entry && open) {
      const data = entry.data || entry.content_data || {};
      setFormData({ ...data });
      setSlug(entry.slug || '');
      setStatus(entry.status || 'draft');
      
      if (entry.content_type_id) {
        loadContentType(entry.content_type_id);
      }
    }
  }, [entry, open]);

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

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    if (!entry) return;

    try {
      setIsSaving(true);
      const updated = await contentApi.updateContentEntry(entry.id, {
        slug,
        status: status as 'draft' | 'published' | 'archived',
        data: formData,
      });
      toast.success('Content saved successfully');
      onSaved(updated);
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.detail || 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (fieldName: string, fieldDef: any) => {
    const value = formData[fieldName];
    const fieldType = fieldDef?.type || 'text';
    const label = fieldDef?.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const isRequired = fieldDef?.required || false;
    const helpText = fieldDef?.help_text;

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldName} className="font-medium">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {fieldType}
          </span>
        </div>

        {/* Text fields */}
        {(fieldType === 'text' || fieldType === 'string' || fieldType === 'email' || fieldType === 'url') && (
          <Input
            id={fieldName}
            type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={helpText || `Enter ${label.toLowerCase()}`}
          />
        )}

        {/* Textarea */}
        {fieldType === 'textarea' && (
          <Textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={helpText || `Enter ${label.toLowerCase()}`}
            rows={4}
          />
        )}

        {/* Number */}
        {fieldType === 'number' && (
          <Input
            id={fieldName}
            type="number"
            value={value ?? ''}
            onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value) || 0)}
            placeholder={helpText || `Enter ${label.toLowerCase()}`}
          />
        )}

        {/* Boolean */}
        {fieldType === 'boolean' && (
          <div className="flex items-center gap-3">
            <Switch
              id={fieldName}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? 'Yes' : 'No'}
            </span>
          </div>
        )}

        {/* Select */}
        {fieldType === 'select' && fieldDef?.options && (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(fieldName, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldDef.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* JSON / Array / Object - Special handling for navigation items and media_gallery */}
        {(fieldType === 'json' || fieldType === 'array' || fieldType === 'object') && (
          fieldName === 'items' && contentType?.api_id === 'navigation' ? (
            <NavigationEditor
              items={Array.isArray(value) ? value : []}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
              allowChildren={true}
              maxDepth={2}
            />
          ) : fieldName === 'media_gallery' ? (
            <MediaGalleryEditor
              value={Array.isArray(value) ? value : []}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
            />
          ) : (
            <JsonFieldEditor
              value={value}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
              fieldName={fieldName}
            />
          )
        )}

        {/* Media */}
        {(fieldType === 'media' || fieldType === 'image' || fieldType === 'file') && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id={fieldName}
                value={value || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder="Enter media URL or click Browse"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMediaPickerField(fieldName);
                  setMediaPickerFileType(fieldType === 'image' ? 'image' : undefined);
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            {value && typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && (
              <img 
                src={resolveMediaUrl(value)} 
                alt={fieldName} 
                className="max-w-xs max-h-32 object-cover rounded border" 
              />
            )}
          </div>
        )}

        {/* Rich text / HTML */}
        {(fieldType === 'richtext' || fieldType === 'html' || fieldType === 'wysiwyg') && (
          <Textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={helpText || `Enter ${label.toLowerCase()}`}
            rows={6}
            className="font-mono text-sm"
          />
        )}

        {/* Date */}
        {fieldType === 'date' && (
          <Input
            id={fieldName}
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        )}

        {/* Datetime */}
        {fieldType === 'datetime' && (
          <Input
            id={fieldName}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        )}

        {/* Fallback for unknown types */}
        {!['text', 'string', 'email', 'url', 'textarea', 'number', 'boolean', 'select', 'json', 'array', 'object', 'media', 'image', 'file', 'richtext', 'html', 'wysiwyg', 'date', 'datetime'].includes(fieldType) && (
          <Input
            id={fieldName}
            value={typeof value === 'object' ? JSON.stringify(value) : (value || '')}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={helpText || `Enter ${label.toLowerCase()}`}
          />
        )}

        {helpText && (
          <p className="text-xs text-muted-foreground">{helpText}</p>
        )}
      </div>
    );
  };

  if (!entry) return null;

  const displayTitle = formData.title || formData.site_name || formData.name || slug;
  
  // Get fields from content type
  const fields = contentType?.fields || [];
  
  // Get all keys from data that might not be in content type
  const dataKeys = Object.keys(formData);
  const fieldNames = new Set(fields.map((f: any) => f.name));
  const extraKeys = dataKeys.filter(k => !fieldNames.has(k));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] md:w-[85vw] md:max-w-[85vw] lg:w-[75vw] lg:max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-xl font-semibold">Edit: {displayTitle}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {contentType?.name || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* System Fields */}
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="font-medium">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-medium">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Type Fields */}
              {fields.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Content Fields</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {fields.map((field: any) => {
                      const isComplex = ['json', 'array', 'object', 'richtext', 'html', 'wysiwyg', 'textarea'].includes(field.type);
                      return (
                        <div key={field.name} className={isComplex ? 'md:col-span-2' : ''}>
                          {renderField(field.name, field)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extra fields not in content type */}
              {extraKeys.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2 text-muted-foreground">
                    Additional Fields
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {extraKeys.map((key) => {
                      const value = formData[key];
                      const inferredType = Array.isArray(value) ? 'array' : typeof value === 'object' ? 'object' : 'text';
                      const isComplex = ['array', 'object'].includes(inferredType);
                      return (
                        <div key={key} className={isComplex ? 'md:col-span-2' : ''}>
                          {renderField(key, { type: inferredType })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={!!mediaPickerField}
        onClose={() => {
          setMediaPickerField(null);
          setMediaPickerFileType(undefined);
        }}
        onSelect={(media: Media) => {
          if (mediaPickerField) {
            // Use primary url field, fallback to public_url or storage_path for backward compatibility
            const mediaUrl = media.url || media.public_url || media.storage_path;
            handleFieldChange(mediaPickerField, mediaUrl);
          }
          setMediaPickerField(null);
          setMediaPickerFileType(undefined);
        }}
        fileType={mediaPickerFileType}
      />
    </Dialog>
  );
}
