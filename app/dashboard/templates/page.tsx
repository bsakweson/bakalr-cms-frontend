'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { templateApi, ContentTemplate, ContentTemplateCreate } from '@/lib/api/templates';
import { contentApi } from '@/lib/api/content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ContentTemplateCreate>({
    content_type_id: '',
    name: '',
    description: '',
    is_published: true,
    category: '',
    tags: [],
    icon: '',
    field_defaults: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, filterCategory, filterPublished, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, typesRes, categoriesRes] = await Promise.all([
        templateApi.listTemplates(),
        contentApi.getContentTypes(),
        templateApi.getCategories(),
      ]);
      setTemplates(templatesRes.templates);
      setContentTypes(typesRes || []);
      setCategories(categoriesRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    if (filterPublished !== 'all') {
      const isPublished = filterPublished === 'published';
      filtered = filtered.filter(t => t.is_published === isPublished);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleCreate = async () => {
    try {
      if (editingTemplate) {
        await templateApi.updateTemplate(editingTemplate.id, formData);
      } else {
        await templateApi.createTemplate(formData);
      }
      setShowDialog(false);
      resetForm();
      setEditingTemplate(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${editingTemplate ? 'update' : 'create'} template`);
    }
  };

  const handleEdit = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      content_type_id: template.content_type_id,
      name: template.name,
      description: template.description || '',
      is_published: template.is_published,
      category: template.category || '',
      tags: template.tags || [],
      icon: template.icon || '',
      field_defaults: template.field_defaults || {},
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await templateApi.deleteTemplate(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      content_type_id: '',
      name: '',
      description: '',
      is_published: true,
      category: '',
      tags: [],
      icon: '',
      field_defaults: {},
    });
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Templates</h1>
          <p className="text-muted-foreground">Reusable templates for faster content creation</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>Create Template</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Templates</CardDescription>
            <CardTitle className="text-3xl">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl">{templates.filter(t => t.is_published).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usage</CardDescription>
            <CardTitle className="text-3xl">{templates.reduce((sum, t) => sum + t.usage_count, 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterCategory !== 'all' || filterPublished !== 'all' 
                ? 'No templates match your filters' 
                : 'No templates yet. Create your first template!'}
            </p>
            {!searchQuery && filterCategory === 'all' && filterPublished === 'all' && (
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>Create Template</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.content_type?.name}
                  </CardDescription>
                </div>
                {template.icon && <span className="text-2xl">{template.icon}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.is_published && <Badge>Published</Badge>}
                {template.category && <Badge variant="outline">{template.category}</Badge>}
                <Badge variant="secondary">{template.usage_count} uses</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(template)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update your content template' : 'Create a reusable content template'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Content Type*</Label>
              <Select value={formData.content_type_id || ''} onValueChange={(v) => setFormData({ ...formData, content_type_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id.toString()}>{ct.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Name*</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Template name" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this template" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Blog, Marketing" />
            </div>
            <div className="grid gap-2">
              <Label>Icon (Emoji)</Label>
              <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="📝" maxLength={2} />
            </div>
            <div className="grid gap-2">
              <Label>Tags (comma-separated)</Label>
              <Input 
                value={formData.tags?.join(', ') || ''} 
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                })} 
                placeholder="article, blog, news" 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate}>{editingTemplate ? 'Update Template' : 'Create Template'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
