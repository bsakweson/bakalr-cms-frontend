'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MediaPickerModal from '@/components/media-picker-modal';
import { resolveMediaUrl } from '@/lib/api/client';
import { Media } from '@/types';
import { ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';

interface MediaItem {
  url: string;
  alt?: string;
}

interface MediaGalleryEditorProps {
  value: MediaItem[];
  onChange: (value: MediaItem[]) => void;
  label?: string;
}

export function MediaGalleryEditor({ value = [], onChange, label }: MediaGalleryEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Ensure value is always an array
  const items = Array.isArray(value) ? value : [];

  const handleAddMedia = (media: Media) => {
    // Use primary url field, fallback to public_url or storage_path for backward compatibility
    const mediaUrl = media.url || media.public_url || media.storage_path || '';
    const newItem: MediaItem = {
      url: mediaUrl,
      alt: media.alt_text || media.filename || '',
    };
    
    if (editingIndex !== null) {
      // Replace existing item
      const newItems = [...items];
      newItems[editingIndex] = newItem;
      onChange(newItems);
      setEditingIndex(null);
    } else {
      // Add new item
      onChange([...items, newItem]);
    }
    setShowMediaPicker(false);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleAltChange = (index: number, alt: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], alt };
    onChange(newItems);
  };

  const handleUrlChange = (index: number, url: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], url };
    onChange(newItems);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
  };

  const getImageUrl = (url: string) => {
    return resolveMediaUrl(url);
  };

  return (
    <div className="space-y-4">
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative group border rounded-lg overflow-hidden bg-muted"
          >
            {/* Image Preview */}
            <div className="aspect-square relative">
              {item.url && item.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={getImageUrl(item.url)}
                  alt={item.alt || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingIndex(index);
                    setShowMediaPicker(true);
                  }}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Order Badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
              
              {/* Reorder Buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === items.length - 1}
                >
                  ↓
                </Button>
              </div>
            </div>
            
            {/* Alt Text Input */}
            <div className="p-2">
              <Input
                value={item.alt || ''}
                onChange={(e) => handleAltChange(index, e.target.value)}
                placeholder="Alt text"
                className="text-xs h-8"
              />
            </div>
          </div>
        ))}
        
        {/* Add New Button */}
        <button
          type="button"
          onClick={() => {
            setEditingIndex(null);
            setShowMediaPicker(true);
          }}
          className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm">Add Image</span>
        </button>
      </div>
      
      {/* Empty State */}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images added yet. Click &quot;Add Image&quot; to add images to the gallery.
        </p>
      )}
      
      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => {
          setShowMediaPicker(false);
          setEditingIndex(null);
        }}
        onSelect={handleAddMedia}
        fileType="image"
      />
    </div>
  );
}
