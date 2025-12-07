'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { contentApi, translationApi, mediaApi } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/client';
import { ContentEntry, ContentType, Translation, Locale, Media } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/rich-text-editor';
import MediaPickerModal from '@/components/media-picker-modal';
import { MediaGalleryEditor } from '@/components/content/media-gallery-editor';
import { Globe, Image as ImageIcon, X, Pencil, Eye, ExternalLink } from 'lucide-react';

export default function ContentEntryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : null;
  const isNew = id === null || params?.id === 'new';

  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Translation state
  const [locales, setLocales] = useState<Locale[]>([]);
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('content');
  
  // Media picker state (for single image/file fields only)
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<string | null>(null);
  
  // Preview dialog state
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadContentTypes();
    loadLocales();
    if (!isNew && id) {
      loadEntry();
    }
  }, [id, isNew]);

  useEffect(() => {
    if (selectedTypeId) {
      loadContentType(selectedTypeId);
    }
  }, [selectedTypeId]);

  const loadContentTypes = async () => {
    try {
      const data = await contentApi.getContentTypes();
      setContentTypes(data);
    } catch (err) {
      console.error('Failed to load content types:', err);
    }
  };

  const loadLocales = async () => {
    try {
      const data = await translationApi.getLocales();
      setLocales(data);
      const defaultLocale = data.find((l) => l.is_default);
      if (defaultLocale) {
        setSelectedLocale(defaultLocale.code);
      }
    } catch (err) {
      console.error('Failed to load locales:', err);
    }
  };

  const loadEntry = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await contentApi.getContentEntry(id);
      setEntry(data);
      setFormData(data.data || data.content_data || {});
      setSlug(data.slug);
      setStatus(data.status);
      setSelectedTypeId(data.content_type_id);
      if (data.content_type) {
        setContentType(data.content_type);
      }
      // Load translations
      await loadTranslations(id);
    } catch (err: any) {
      setError('Failed to load content entry');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTranslations = async (contentId: string) => {
    try {
      const data = await translationApi.getContentTranslations(contentId);
      const translationsMap: Record<string, Record<string, any>> = {};
      data.forEach((translation) => {
        const locale = locales.find((l) => l.id === translation.locale_id);
        if (locale) {
          translationsMap[locale.code] = translation.translated_data;
        }
      });
      setTranslations(translationsMap);
    } catch (err) {
      console.error('Failed to load translations:', err);
    }
  };

  // Helper to convert fields array to schema object format
  const getFieldsAsSchema = (ct: ContentType | null): Record<string, any> => {
    if (!ct) return {};
    
    // If schema exists and has fields property, use it
    if (ct.schema?.fields && typeof ct.schema.fields === 'object') {
      return ct.schema.fields;
    }
    
    // If schema is already in the right format (object with field definitions)
    if (ct.schema && typeof ct.schema === 'object' && !Array.isArray(ct.schema)) {
      const hasFieldDefs = Object.values(ct.schema).some(
        (v: any) => v && typeof v === 'object' && 'type' in v
      );
      if (hasFieldDefs) return ct.schema;
    }
    
    // Convert fields array to schema object
    if (ct.fields && Array.isArray(ct.fields)) {
      const schema: Record<string, any> = {};
      ct.fields.forEach((field) => {
        schema[field.name] = {
          type: field.type,
          label: field.label || field.name,
          required: field.required,
          localized: field.localized,
          default: field.default,
          help_text: field.help_text,
          validation: field.validation,
        };
      });
      return schema;
    }
    
    return {};
  };

  const loadContentType = async (typeId: string) => {
    try {
      const data = await contentApi.getContentType(typeId);
      console.log('Loaded content type:', data);
      console.log('Content type fields:', data.fields);
      console.log('Content type schema:', data.schema);
      setContentType(data);
    } catch (err) {
      console.error('Failed to load content type:', err);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleTranslationChange = (localeCode: string, fieldKey: string, value: any) => {
    setTranslations((prev) => ({
      ...prev,
      [localeCode]: {
        ...(prev[localeCode] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const handleMediaSelect = (media: Media) => {
    // Use primary url field, fallback to public_url or storage_path for backward compatibility
    const mediaUrl = media.url || media.public_url || media.storage_path;
    
    // Handle single media field
    if (currentMediaField) {
      if (activeTab === 'content') {
        handleFieldChange(currentMediaField, mediaUrl);
      } else {
        handleTranslationChange(selectedLocale, currentMediaField, mediaUrl);
      }
    }
    setShowMediaPicker(false);
    setCurrentMediaField(null);
  };

  const openMediaPicker = (fieldKey: string) => {
    setCurrentMediaField(fieldKey);
    setShowMediaPicker(true);
  };

  const generateSlug = () => {
    const title = formData.title || formData.name || '';
    if (title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(newSlug);
    }
  };

  const handleSave = async () => {
    if (!selectedTypeId) {
      toast.error('Please select a content type');
      return;
    }

    if (!slug) {
      toast.error('Please enter a slug');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        content_type_id: selectedTypeId,
        slug,
        status,
        content_data: formData,
      };

      let savedId = id;
      if (isNew) {
        const newEntry = await contentApi.createContentEntry(payload);
        savedId = newEntry.id;
        router.push(`/dashboard/content/${newEntry.id}`);
      } else if (id) {
        await contentApi.updateContentEntry(id, payload);
      }

      // Save translations
      if (savedId && Object.keys(translations).length > 0) {
        for (const [localeCode, translationData] of Object.entries(translations)) {
          if (Object.keys(translationData).length > 0) {
            try {
              await translationApi.createOrUpdateTranslation(savedId, localeCode, translationData);
            } catch (err) {
              console.error(`Failed to save translation for ${localeCode}:`, err);
            }
          }
        }
      }

      toast.success('Content saved successfully');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) {
      toast.error('Please save the content first');
      return;
    }

    try {
      await contentApi.publishContentEntry(id);
      setStatus('published');
      toast.success('Content published successfully');
    } catch (err: any) {
      toast.error('Failed to publish: ' + (err.response?.data?.detail || err.message));
    }
  };

  const renderField = (fieldKey: string, fieldConfig: any, isTranslation = false, localeCode = '') => {
    const value = isTranslation 
      ? (translations[localeCode]?.[fieldKey] || '') 
      : (formData[fieldKey] || '');
    const fieldType = fieldConfig.type || 'text';
    const label = fieldConfig.label || fieldKey;
    const required = fieldConfig.required || false;
    const description = fieldConfig.description;

    const onChange = (newValue: any) => {
      if (isTranslation) {
        handleTranslationChange(localeCode, fieldKey, newValue);
      } else {
        handleFieldChange(fieldKey, newValue);
      }
    };

    return (
      <div key={`${localeCode}-${fieldKey}`} className="space-y-2">
        <Label htmlFor={`${localeCode}-${fieldKey}`}>
          {label}
          {required && !isTranslation && <span className="text-destructive ml-1">*</span>}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        
        {/* Rich Text Editor */}
        {(fieldType === 'richtext' || fieldType === 'wysiwyg' || fieldType === 'html') ? (
          <RichTextEditor
            content={value}
            onChange={onChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
            onImageAdd={() => openMediaPicker(fieldKey)}
          />
        ) : /* Image/File Field with Media Picker */
        (fieldType === 'image' || fieldType === 'file' || fieldType === 'media') ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id={`${localeCode}-${fieldKey}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Image URL or path"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaPicker(fieldKey)}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            {value && fieldType === 'image' && (
              <img
                src={resolveMediaUrl(value)}
                alt={label}
                className="max-w-xs rounded border"
              />
            )}
          </div>
        ) : /* Textarea */
        fieldType === 'textarea' ? (
          <Textarea
            id={`${localeCode}-${fieldKey}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            required={required && !isTranslation}
          />
        ) : /* Number */
        fieldType === 'number' ? (
          <Input
            id={`${localeCode}-${fieldKey}`}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required && !isTranslation}
          />
        ) : /* Email */
        fieldType === 'email' ? (
          <Input
            id={`${localeCode}-${fieldKey}`}
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required && !isTranslation}
          />
        ) : /* URL */
        fieldType === 'url' ? (
          <Input
            id={`${localeCode}-${fieldKey}`}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required && !isTranslation}
          />
        ) : /* Select */
        fieldType === 'select' && fieldConfig.options ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options.map((option: any) => (
                <SelectItem key={option.value || option} value={option.value || option}>
                  {option.label || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : /* Boolean */
        fieldType === 'boolean' ? (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${localeCode}-${fieldKey}`}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={`${localeCode}-${fieldKey}`} className="font-normal">
              {label}
            </Label>
          </div>
        ) : /* JSON/Array/Object - Media Gallery or general JSON */
        (fieldType === 'json' || fieldType === 'array' || fieldType === 'object') ? (
          <MediaGalleryEditor
            value={value || []}
            onChange={onChange}
            label={label}
          />
        ) : /* Default Text Input */
        (
          <Input
            id={`${localeCode}-${fieldKey}`}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required && !isTranslation}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-destructive">{error}</div>
        <Button asChild>
          <Link href="/dashboard/content">Back to Content</Link>
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
              <Link href="/dashboard/content">← Back</Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'Create Content' : 'Edit Content'}
          </h1>
          <p className="text-muted-foreground">
            {contentType ? contentType.name : 'Select a content type'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          {!isNew && status !== 'published' && (
            <Button onClick={handlePublish}>Publish</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type Selection (for new entries) */}
          {isNew && (
            <Card>
              <CardHeader>
                <CardTitle>Content Type</CardTitle>
                <CardDescription>Select the type of content you want to create</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedTypeId || ''}
                  onValueChange={(val) => setSelectedTypeId(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Fields with Tabs */}
          {contentType && (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Fill in the content details and translations</CardDescription>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
                      <div>Fields array: {contentType.fields?.length || 0} items</div>
                      <div>Schema: {contentType.schema ? 'present' : 'null'}</div>
                      <div>getFieldsAsSchema keys: {Object.keys(getFieldsAsSchema(contentType)).join(', ') || 'none'}</div>
                    </div>
                  </details>
                )}
              </CardHeader>
              <CardContent>
                {/* Show message if no fields */}
                {Object.keys(getFieldsAsSchema(contentType)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No fields defined for this content type.</p>
                    <p className="text-xs mt-2">Fields array: {JSON.stringify(contentType.fields?.slice(0, 2))}...</p>
                  </div>
                )}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">
                      Default Content
                    </TabsTrigger>
                    {locales.filter(l => !l.is_default).map((locale) => (
                      <TabsTrigger 
                        key={locale.code} 
                        value={locale.code}
                        onClick={() => setSelectedLocale(locale.code)}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {locale.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    {Object.entries(getFieldsAsSchema(contentType)).map(([fieldKey, fieldConfig]: [string, any]) =>
                      renderField(fieldKey, fieldConfig, false)
                    )}
                  </TabsContent>

                  {locales.filter(l => !l.is_default).map((locale) => (
                    <TabsContent key={locale.code} value={locale.code} className="space-y-4">
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Translate content to <strong>{locale.name}</strong>. 
                          Fields left empty will fall back to the default content.
                        </p>
                      </div>
                      {Object.entries(getFieldsAsSchema(contentType)).map(([fieldKey, fieldConfig]: [string, any]) =>
                        renderField(fieldKey, fieldConfig, true, locale.code)
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Media Picker Modal */}
          <MediaPickerModal
            open={showMediaPicker}
            onClose={() => {
              setShowMediaPicker(false);
              setCurrentMediaField(null);
            }}
            onSelect={handleMediaSelect}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="content-slug"
                  />
                  <Button variant="outline" size="sm" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
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

              {entry && (
                <>
                  <div className="pt-4 border-t">
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>{' '}
                        {new Date(entry.updated_at).toLocaleDateString()}
                      </div>
                      {entry.published_at && (
                        <div>
                          <span className="text-muted-foreground">Published:</span>{' '}
                          {new Date(entry.published_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {!isNew && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-[95vw] md:w-[85vw] md:max-w-[85vw] lg:w-[75vw] lg:max-w-[75vw] xl:max-w-6xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span>Preview: {formData?.title || slug || 'Content'}</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowPreview(false);
                              router.push(`/dashboard/content/${id}/edit`);
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto space-y-6 py-4">
                      {/* Metadata Section */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            status === 'published' ? 'bg-green-100 text-green-800' :
                            status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Slug</p>
                          <p className="text-sm font-mono">{slug || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Content Type</p>
                          <p className="text-sm">{contentType?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm">{entry?.updated_at ? new Date(entry.updated_at).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                      
                      {/* Fields Preview */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Content Fields</h3>
                        {/* Debug section */}
                        <details className="text-xs bg-muted/50 p-2 rounded">
                          <summary className="cursor-pointer">Debug: Field Schema Info</summary>
                          <div className="mt-2 font-mono space-y-2">
                            <div>contentType exists: {contentType ? 'yes' : 'no'}</div>
                            <div>contentType.fields: {contentType?.fields?.length || 0} items</div>
                            <div>contentType.schema: {contentType?.schema ? 'present' : 'null'}</div>
                            <div>getFieldsAsSchema keys: [{Object.keys(getFieldsAsSchema(contentType)).join(', ')}]</div>
                            <div>formData keys: [{Object.keys(formData).join(', ')}]</div>
                            <details className="mt-2">
                              <summary className="cursor-pointer">Raw formData</summary>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                                {JSON.stringify(formData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </details>
                        {Object.keys(getFieldsAsSchema(contentType)).length > 0 ? (
                          <div className="grid gap-4">
                            {Object.entries(getFieldsAsSchema(contentType)).map(([key, fieldDef]: [string, any]) => {
                              const value = formData[key];
                              return (
                                <div key={key} className="border rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{fieldDef.label || key}</span>
                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {fieldDef.type}
                                    </span>
                                    {fieldDef.required && (
                                      <span className="text-xs text-red-500">*</span>
                                    )}
                                  </div>
                                  <div className="text-sm">
                                    {value === undefined || value === null ? (
                                      <span className="text-muted-foreground italic">Not set</span>
                                    ) : value === '' ? (
                                      <span className="text-muted-foreground italic">Empty</span>
                                    ) : fieldDef.type === 'richtext' || fieldDef.type === 'wysiwyg' || fieldDef.type === 'html' ? (
                                      <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: value }}
                                      />
                                    ) : fieldDef.type === 'boolean' ? (
                                      <span className={value ? 'text-green-600' : 'text-red-600'}>
                                        {value ? '✓ Yes' : '✗ No'}
                                      </span>
                                    ) : fieldDef.type === 'image' || fieldDef.type === 'file' || fieldDef.type === 'media' ? (
                                      <div>
                                        {typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                                          <img src={resolveMediaUrl(value)} alt={key} className="max-w-xs max-h-48 object-cover rounded" />
                                        ) : (
                                          <a href={resolveMediaUrl(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {value}
                                          </a>
                                        )}
                                      </div>
                                    ) : typeof value === 'object' ? (
                                      <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    ) : (
                                      <span>{String(value)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No fields defined</div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="destructive" className="w-full">
                  Delete
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
