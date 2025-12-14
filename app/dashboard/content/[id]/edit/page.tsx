'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Eye } from 'lucide-react';

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;
  
  const [content, setContent] = useState<ContentEntry | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    slug: '',
    status: 'draft',
    fields: {},
  });
  const [showPreview, setShowPreview] = useState(false);

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
      
      // Set form data - API returns 'data', not 'content_data'
      setFormData({
        slug: entry.slug || '',
        status: entry.status || 'draft',
        fields: entry.data || entry.content_data || {},
      });
    } catch (error) {
      console.error('Failed to load content:', error);
      toast.error('Failed to load content');
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
        data: formData.fields,
      });
      toast.success('Content updated successfully');
      router.push('/dashboard/content');
    } catch (error: any) {
      console.error('Failed to update content:', error);
      toast.error('Failed to update content: ' + (error.response?.data?.detail || error.message));
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
      toast.error('Failed to delete content: ' + (error.response?.data?.detail || error.message));
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

      case 'json':
      case 'array':
      case 'object':
        return (
          <div key={fieldName}>
            <Label htmlFor={fieldName}>
              {fieldSchema.label || fieldName}
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
                  // Keep the raw string value if parsing fails (while typing)
                  handleFieldChange(fieldName, e.target.value);
                }
              }}
              placeholder={fieldSchema.description || 'Enter JSON array or object'}
              required={isRequired}
              rows={6}
              className="font-mono text-sm"
            />
            {fieldSchema.description && (
              <p className="text-xs text-muted-foreground mt-1">{fieldSchema.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Format: JSON array or object (e.g., ["url1", "url2"] or {'{'}"key": "value"{'}'})
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
        <div className="flex items-center gap-2">
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[95vw] md:w-[85vw] md:max-w-[85vw] lg:w-[75vw] lg:max-w-[75vw] xl:max-w-6xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Preview: {formData.fields?.site_name || formData.fields?.title || formData.slug || 'Content'}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-6 py-4">
                {/* Metadata Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      formData.status === 'published' ? 'bg-green-100 text-green-800' :
                      formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slug</p>
                    <p className="text-sm font-mono">{formData.slug || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Content Type</p>
                    <p className="text-sm">{contentType?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{content?.updated_at ? new Date(content.updated_at).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
                
                {/* Fields Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Content Fields</h3>
                  {contentType?.fields && contentType.fields.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {contentType.fields.map((field) => {
                        const value = formData.fields[field.name];
                        return (
                          <div key={field.name} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{field.label || field.name}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {field.type}
                              </span>
                              {field.required && (
                                <span className="text-xs text-red-500">*</span>
                              )}
                            </div>
                            <div className="text-sm">
                              {value === undefined || value === null ? (
                                <span className="text-muted-foreground italic">Not set</span>
                              ) : value === '' ? (
                                <span className="text-muted-foreground italic">Empty</span>
                              ) : field.type === 'boolean' ? (
                                <span className={value ? 'text-green-600' : 'text-red-600'}>
                                  {value ? '✓ Yes' : '✗ No'}
                                </span>
                              ) : field.type === 'json' || field.type === 'array' || field.type === 'object' || typeof value === 'object' ? (
                                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <span className="wrap-break-words">{String(value)}</span>
                              )}
                            </div>
                            {field.help_text && (
                              <p className="text-xs text-muted-foreground mt-2">{field.help_text}</p>
                            )}
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
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
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
            {contentType?.fields && contentType.fields.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Content Fields</h3>
                <div className="space-y-4">
                  {contentType.fields.map((field) => 
                    renderField(field.name, field)
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
