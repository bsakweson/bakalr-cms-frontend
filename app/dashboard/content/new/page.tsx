'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contentApi } from '@/lib/api';
import { ContentType } from '@/types';
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
import { ArrowLeft } from 'lucide-react';

export default function NewContentPage() {
  const router = useRouter();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    status: 'draft',
    fields: {},
  });

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      const type = contentTypes.find(t => t.id === parseInt(selectedTypeId));
      setSelectedType(type || null);
      
      // Initialize form fields based on content type fields
      if (type?.fields) {
        const initialFields: any = {};
        type.fields.forEach(field => {
          // Set default values based on field type
          if (field.default !== null && field.default !== undefined) {
            initialFields[field.name] = field.default;
          } else if (field.type === 'boolean') {
            initialFields[field.name] = false;
          } else if (field.type === 'number') {
            initialFields[field.name] = 0;
          } else if (field.type === 'json') {
            initialFields[field.name] = [];
          } else {
            initialFields[field.name] = '';
          }
        });
        setFormData({ ...formData, fields: initialFields, content_type_id: type.id });
      }
    }
  }, [selectedTypeId, contentTypes]);

  const loadContentTypes = async () => {
    try {
      setIsLoading(true);
      const data = await contentApi.getContentTypes();
      setContentTypes(data);
    } catch (error) {
      console.error('Failed to load content types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: generateSlug(value),
    });
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      fields: {
        ...formData.fields,
        [fieldName]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      alert('Please select a content type');
      return;
    }

    try {
      setIsSaving(true);
      await contentApi.createContentEntry(formData);
      router.push('/dashboard/content');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      alert('Failed to create content: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (fieldName: string, fieldSchema: any) => {
    const fieldValue = formData.fields[fieldName] || '';
    const fieldType = fieldSchema.type;
    const isRequired = fieldSchema.required || false;

    switch (fieldType) {
      case 'text':
      case 'string':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldSchema.description}
              required={isRequired}
            />
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );

      case 'textarea':
      case 'text':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldSchema.description}
              required={isRequired}
              rows={4}
            />
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value) || 0)}
              placeholder={fieldSchema.description}
              required={isRequired}
            />
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldName} className="flex items-center space-x-2">
            <input
              id={fieldName}
              type="checkbox"
              checked={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={fieldValue} onValueChange={(value) => handleFieldChange(fieldName, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
          </div>
        );

      case 'json':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.help_text || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleFieldChange(fieldName, parsed);
                } catch {
                  // Allow editing invalid JSON
                  handleFieldChange(fieldName, e.target.value);
                }
              }}
              placeholder='["url1", "url2"] or {"key": "value"}'
              required={isRequired}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter valid JSON (array or object)
            </p>
          </div>
        );

      default:
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={fieldSchema.description}
              required={isRequired}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
          <p className="text-muted-foreground">Create a new content entry</p>
        </div>
      </div>

      {contentTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No Content Types</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a content type first before creating content entries
            </p>
            <Button onClick={() => router.push('/dashboard/content-types')}>
              Go to Content Types
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>Fill in the details for your new content entry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div>
                <Label htmlFor="content_type">Content Type *</Label>
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId} required>
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
              </div>

              {selectedType && (
                <>
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter content title"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-generated from title, but you can customize it
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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

                  {/* Dynamic Fields */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Content Fields</h3>
                    <div className="space-y-4">
                      {selectedType.fields && selectedType.fields.map((field) => 
                        renderField(field.name, field)
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !selectedType}>
              {isSaving ? 'Creating...' : 'Create Content'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
