'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { contentApi, translationApi, mediaApi } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/rich-text-editor';
import MediaPickerModal from '@/components/media-picker-modal';
import { Globe, Image as ImageIcon } from 'lucide-react';

export default function ContentEntryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? parseInt(params.id as string) : null;
  const isNew = id === null || params?.id === 'new';

  const [entry, setEntry] = useState<ContentEntry | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Translation state
  const [locales, setLocales] = useState<Locale[]>([]);
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('content');
  
  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<string | null>(null);

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
      setFormData(data.content_data || {});
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

  const loadTranslations = async (contentId: number) => {
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

  const loadContentType = async (typeId: number) => {
    try {
      const data = await contentApi.getContentType(typeId);
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
    if (currentMediaField) {
      if (activeTab === 'content') {
        handleFieldChange(currentMediaField, media.public_url || media.storage_path);
      } else {
        handleTranslationChange(selectedLocale, currentMediaField, media.public_url || media.storage_path);
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
      alert('Please select a content type');
      return;
    }

    if (!slug) {
      alert('Please enter a slug');
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

      alert('Content saved successfully');
    } catch (err: any) {
      alert('Failed to save: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) {
      alert('Please save the content first');
      return;
    }

    try {
      await contentApi.publishContentEntry(id);
      setStatus('published');
      alert('Content published successfully');
    } catch (err: any) {
      alert('Failed to publish: ' + (err.response?.data?.detail || err.message));
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
                src={value.startsWith('http') ? value : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${value}`}
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
                  value={selectedTypeId?.toString() || ''}
                  onValueChange={(val) => setSelectedTypeId(parseInt(val))}
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
              </CardHeader>
              <CardContent>
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
                    {Object.entries(contentType.schema || {}).map(([fieldKey, fieldConfig]: [string, any]) =>
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
                      {Object.entries(contentType.schema || {}).map(([fieldKey, fieldConfig]: [string, any]) =>
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
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/preview/content/${id}`} target="_blank">
                    Preview
                  </Link>
                </Button>
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
