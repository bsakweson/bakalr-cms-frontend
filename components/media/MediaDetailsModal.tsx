'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { mediaApi } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/client';
import { Media } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface MediaDetailsModalProps {
  media: Media | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function MediaDetailsModal({ media, open, onClose, onUpdate, onDelete }: MediaDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [formData, setFormData] = useState({
    alt_text: '',
    filename: '',
  });

  const handleEdit = () => {
    if (media) {
      setFormData({
        alt_text: media.alt_text || '',
        filename: media.filename,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!media) return;
    
    try {
      setIsSaving(true);
      await mediaApi.updateMedia(media.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update media:', error);
      toast.error('Failed to update media');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!media) return;
    
    try {
      setIsDeleting(true);
      await mediaApi.deleteMedia(media.id);
      setShowDeleteConfirm(false);
      onClose();
      onDelete();
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast.error('Failed to delete media');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !media) return;

    try {
      setIsReplacing(true);
      
      // Delete old media
      await mediaApi.deleteMedia(media.id);
      
      // Upload new media
      const formData = new FormData();
      formData.append('file', file);
      
      await mediaApi.uploadMedia(formData);
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to replace image:', error);
      toast.error('Failed to replace image');
    } finally {
      setIsReplacing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Details</DialogTitle>
          <DialogDescription>
            View and edit media file information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {media.url || media.cdn_url ? (
              <img
                src={resolveMediaUrl(media.cdn_url || media.url)}
                alt={media.alt_text || media.filename}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-6xl">
                {media.media_type === 'image' ? '🖼️' : 
                 media.media_type === 'video' ? '🎥' :
                 media.media_type === 'audio' ? '🎵' : '📄'}
              </span>
            )}
          </div>

          {/* Details */}
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Filename</Label>
                <p className="text-sm mt-1">{media.filename}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Type</Label>
                  <div className="mt-1">
                    <Badge>{media.mime_type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Size</Label>
                  <p className="text-sm mt-1">{formatFileSize(media.file_size)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Alt Text</Label>
                <p className="text-sm mt-1">{media.alt_text || 'No alt text'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Uploaded</Label>
                <p className="text-sm mt-1">{formatDate(media.created_at)}</p>
              </div>

              {media.public_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">URL</Label>
                  <p className="text-sm mt-1 break-all text-blue-600">{media.public_url}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={formData.filename}
                  onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Textarea
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="Describe this image for accessibility"
                  rows={3}
                />
              </div>

              {media.media_type === 'image' && (
                <div>
                  <Label>Replace Image</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="replace-file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleReplaceImage}
                      disabled={isReplacing}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('replace-file')?.click()}
                      disabled={isReplacing}
                      className="w-full"
                    >
                      {isReplacing ? 'Replacing...' : 'Upload New Image'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will delete the current image and upload a new one
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
              <Button onClick={onClose}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogFooter>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this file? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
