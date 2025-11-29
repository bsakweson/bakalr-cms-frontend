'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { contentApi } from '@/lib/api';
import { ContentEntry, ContentType } from '@/types';
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

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = parseInt(params?.id as string);
  
  const [content, setContent] = useState<ContentEntry | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    slug: '',
    status: 'draft',
    fields: {},
  });

  useEffect(() => {
    loadContent();
  }, [contentId]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const entry = await contentApi.getContentEntry(contentId);
      setContent(entry);
      
      // Load content type
      if (entry.content_type_id) {
        const type = await contentApi.getContentType(entry.content_type_id);
        setContentType(type);
      }
      
      // Set form data
      setFormData({
        slug: entry.slug || '',
        status: entry.status || 'draft',
        fields: entry.content_data || {},
      });
    } catch (error) {
      console.error('Failed to load content:', error);
      alert('Failed to load content');
      router.push('/dashboard/content');
    } finally {
      setIsLoading(false);
    }
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
    
    try {
      setIsSaving(true);
      await contentApi.updateContentEntry(contentId, {
        slug: formData.slug,
        status: formData.status,
        content_data: formData.fields,
      });
      router.push('/dashboard/content');
    } catch (error: any) {
      console.error('Failed to update content:', error);
      alert('Failed to update content: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteContentEntry(contentId);
      router.push('/dashboard/content');
    } catch (error: any) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content: ' + (error.response?.data?.detail || error.message));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Content</h1>
            <p className="text-muted-foreground">Update your content entry</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>Update the details for your content entry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            {contentType?.schema && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Content Fields</h3>
                <div className="space-y-4">
                  {Object.entries(contentType.schema).map(([fieldName, fieldSchema]) => 
                    renderField(fieldName, fieldSchema)
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
