'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { contentApi } from '@/lib/api';
import { ContentType } from '@/types';
import { FIELD_TYPES, getFieldTypeDefinition, generateFieldKey } from '@/lib/field-types';
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
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical, Save, X, ArrowLeft } from 'lucide-react';

interface FieldConfig {
  id: string;
  key: string;
  config: Record<string, any>;
}

export default function ContentTypeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [apiName, setApiName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && editId) {
      loadContentType(parseInt(editId));
    }
  }, [isEdit, editId]);

  useEffect(() => {
    if (!isEdit && name && !apiName) {
      setApiName(generateFieldKey(name));
    }
  }, [name, isEdit, apiName]);

  const loadContentType = async (id: number) => {
    try {
      setIsLoading(true);
      const data = await contentApi.getContentType(id);
      setName(data.name);
      setApiName(data.slug);
      setDescription(data.description || '');
      
      // Convert schema to fields array
      const schemaFields: FieldConfig[] = Object.entries(data.schema || {}).map(
        ([key, config]: [string, any], index) => ({
          id: `field-${index}`,
          key,
          config,
        })
      );
      setFields(schemaFields);
    } catch (err) {
      console.error('Failed to load content type:', err);
      alert('Failed to load content type');
    } finally {
      setIsLoading(false);
    }
  };

  const addField = (type: string) => {
    const fieldType = getFieldTypeDefinition(type);
    if (!fieldType) return;

    const newField: FieldConfig = {
      id: `field-${Date.now()}`,
      key: generateFieldKey(fieldType.defaultConfig.label),
      config: { ...fieldType.defaultConfig },
    };

    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FieldConfig>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const updateFieldConfig = (id: string, configKey: string, value: any) => {
    setFields(
      fields.map((field) =>
        field.id === id
          ? { ...field, config: { ...field.config, [configKey]: value } }
          : field
      )
    );
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
    }
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex((f) => f.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const validateSchema = (): boolean => {
    if (!name.trim()) {
      alert('Please enter a content type name');
      return false;
    }

    if (!apiName.trim()) {
      alert('Please enter an API name');
      return false;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return false;
    }

    // Check for duplicate keys
    const keys = fields.map((f) => f.key);
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      alert(`Duplicate field keys found: ${duplicates.join(', ')}`);
      return false;
    }

    // Validate field configurations
    for (const field of fields) {
      if (!field.key.trim()) {
        alert('All fields must have a key');
        return false;
      }
      if (!field.config.label?.trim()) {
        alert(`Field "${field.key}" must have a label`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSchema()) return;

    try {
      setIsSaving(true);

      // Convert fields array to schema object
      const schema: Record<string, any> = {};
      fields.forEach((field) => {
        schema[field.key] = field.config;
      });

      const payload = {
        name,
        slug: apiName,
        description: description || undefined,
        schema,
      };

      if (isEdit && editId) {
        await contentApi.updateContentType(parseInt(editId), payload);
        alert('Content type updated successfully');
      } else {
        const created = await contentApi.createContentType(payload);
        alert('Content type created successfully');
        router.push(`/dashboard/content-types/${created.id}`);
      }
    } catch (err: any) {
      alert('Failed to save: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedFieldData = fields.find((f) => f.id === selectedField);
  const selectedFieldType = selectedFieldData
    ? getFieldTypeDefinition(selectedFieldData.config.type)
    : null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/content-types">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Edit Content Type' : 'Create Content Type'}
          </h1>
          <p className="text-muted-foreground">
            Define fields and structure for your content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/content-types">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Basic Info & Field List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and description for your content type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blog Post, Product, Author"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiName">API Name *</Label>
                <Input
                  id="apiName"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  placeholder="e.g., blog_post, product, author"
                />
                <p className="text-xs text-muted-foreground">
                  Used in API endpoints and queries. Use lowercase and underscores.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this content type is used for"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Fields ({fields.length})</CardTitle>
              <CardDescription>Add and configure fields for your content</CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">No fields yet. Add fields from the sidebar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedField === field.id
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedField(field.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'down');
                          }}
                          disabled={index === fields.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.config.label || field.key}</span>
                          <Badge variant="outline">{field.config.type}</Badge>
                          {field.config.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Key: {field.key}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteField(field.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Field Types & Editor */}
        <div className="space-y-6">
          {/* Field Types */}
          {!selectedField && (
            <Card>
              <CardHeader>
                <CardTitle>Add Field</CardTitle>
                <CardDescription>Choose a field type to add</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map((fieldType) => (
                    <Button
                      key={fieldType.type}
                      variant="outline"
                      className="h-auto flex-col items-start p-3"
                      onClick={() => addField(fieldType.type)}
                    >
                      <div className="text-2xl mb-1">{fieldType.icon}</div>
                      <div className="text-sm font-medium">{fieldType.label}</div>
                      <div className="text-xs text-muted-foreground text-left">
                        {fieldType.description}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Field Editor */}
          {selectedField && selectedFieldData && selectedFieldType && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Edit Field</CardTitle>
                    <CardDescription>{selectedFieldType.label} field</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedField(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Field Key */}
                <div className="space-y-2">
                  <Label htmlFor="fieldKey">Field Key *</Label>
                  <Input
                    id="fieldKey"
                    value={selectedFieldData.key}
                    onChange={(e) =>
                      updateField(selectedField, { key: e.target.value })
                    }
                    placeholder="field_key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to access this field in your code
                  </p>
                </div>

                <Separator />

                {/* Dynamic Properties */}
                {selectedFieldType.configurableProperties.map((prop) => (
                  <div key={prop.name} className="space-y-2">
                    <Label htmlFor={prop.name}>{prop.label}</Label>
                    {prop.type === 'text' ? (
                      <Input
                        id={prop.name}
                        value={selectedFieldData.config[prop.name] || ''}
                        onChange={(e) =>
                          updateFieldConfig(selectedField, prop.name, e.target.value)
                        }
                      />
                    ) : prop.type === 'textarea' ? (
                      <Textarea
                        id={prop.name}
                        value={selectedFieldData.config[prop.name] || ''}
                        onChange={(e) =>
                          updateFieldConfig(selectedField, prop.name, e.target.value)
                        }
                        rows={3}
                      />
                    ) : prop.type === 'number' ? (
                      <Input
                        id={prop.name}
                        type="number"
                        value={selectedFieldData.config[prop.name] ?? ''}
                        onChange={(e) =>
                          updateFieldConfig(
                            selectedField,
                            prop.name,
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    ) : prop.type === 'boolean' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={prop.name}
                          checked={!!selectedFieldData.config[prop.name]}
                          onChange={(e) =>
                            updateFieldConfig(selectedField, prop.name, e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        <Label htmlFor={prop.name} className="font-normal">
                          {prop.label}
                        </Label>
                      </div>
                    ) : null}
                  </div>
                ))}

                <Separator />

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteField(selectedField)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Field
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
