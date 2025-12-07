'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  GripVertical,
  ExternalLink,
  Home,
  ChevronUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NavigationItem {
  label: string;
  href: string;
  order?: number;
  icon?: string;
  children?: NavigationItem[];
}

interface NavigationEditorProps {
  items: NavigationItem[];
  onChange: (items: NavigationItem[]) => void;
  readOnly?: boolean;
  allowChildren?: boolean;
  maxDepth?: number;
}

export function NavigationEditor({ 
  items = [], 
  onChange, 
  readOnly = false,
  allowChildren = true,
  maxDepth = 2
}: NavigationEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const addItem = () => {
    const newItem: NavigationItem = {
      label: 'New Item',
      href: '/',
      order: items.length + 1
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    // Re-order remaining items
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    onChange(newItems);
  };

  const updateItem = (index: number, updates: Partial<NavigationItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Re-order items
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    onChange(newItems);
  };

  const addChild = (parentIndex: number) => {
    const newItems = [...items];
    const parent = newItems[parentIndex];
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push({
      label: 'New Sub-item',
      href: '/'
    });
    onChange(newItems);
  };

  const removeChild = (parentIndex: number, childIndex: number) => {
    const newItems = [...items];
    newItems[parentIndex].children?.splice(childIndex, 1);
    if (newItems[parentIndex].children?.length === 0) {
      delete newItems[parentIndex].children;
    }
    onChange(newItems);
  };

  const updateChild = (parentIndex: number, childIndex: number, updates: Partial<NavigationItem>) => {
    const newItems = [...items];
    if (newItems[parentIndex].children) {
      newItems[parentIndex].children![childIndex] = {
        ...newItems[parentIndex].children![childIndex],
        ...updates
      };
    }
    onChange(newItems);
  };

  const renderItem = (item: NavigationItem, index: number, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(index);
    const canHaveChildren = allowChildren && depth < maxDepth - 1;

    return (
      <Card key={index} className={`p-3 ${depth > 0 ? 'ml-6 mt-2' : ''}`}>
        <div className="flex items-center gap-2">
          {/* Drag handle (visual only for now) */}
          {!readOnly && (
            <div className="cursor-grab text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Expand/collapse for items with children */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(index)}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Label input */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Label</Label>
              {readOnly ? (
                <div className="text-sm font-medium">{item.label}</div>
              ) : (
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                  className="h-8"
                  placeholder="Menu label"
                />
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              {readOnly ? (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {item.href}
                  <ExternalLink className="h-3 w-3" />
                </div>
              ) : (
                <Input
                  value={item.href}
                  onChange={(e) => updateItem(index, { href: e.target.value })}
                  className="h-8"
                  placeholder="/path"
                />
              )}
            </div>
          </div>

          {/* Icon field (optional) */}
          {item.icon !== undefined && (
            <div className="w-24">
              <Label className="text-xs text-muted-foreground">Icon</Label>
              {readOnly ? (
                <div className="text-sm">{item.icon}</div>
              ) : (
                <Input
                  value={item.icon || ''}
                  onChange={(e) => updateItem(index, { icon: e.target.value })}
                  className="h-8"
                  placeholder="icon"
                />
              )}
            </div>
          )}

          {/* Order display */}
          <div className="text-xs text-muted-foreground w-8 text-center">
            #{item.order || index + 1}
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="h-7 w-7 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="h-7 w-7 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              {canHaveChildren && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addChild(index)}
                  className="h-7 px-2"
                  title="Add sub-item"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-3 border-l-2 border-muted pl-2">
            {item.children!.map((child, childIndex) => (
              <div key={childIndex} className="flex items-center gap-2 py-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Label</Label>
                    {readOnly ? (
                      <div className="text-sm">{child.label}</div>
                    ) : (
                      <Input
                        value={child.label}
                        onChange={(e) => updateChild(index, childIndex, { label: e.target.value })}
                        className="h-7 text-sm"
                        placeholder="Sub-item label"
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">URL</Label>
                    {readOnly ? (
                      <div className="text-sm text-muted-foreground">{child.href}</div>
                    ) : (
                      <Input
                        value={child.href}
                        onChange={(e) => updateChild(index, childIndex, { href: e.target.value })}
                        className="h-7 text-sm"
                        placeholder="/path"
                      />
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChild(index, childIndex)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} menu item{items.length !== 1 ? 's' : ''}
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No menu items yet</p>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
