'use client';

import { useEffect, useState } from 'react';
import { mediaApi } from '@/lib/api/media';
import { Media } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Upload, Check } from 'lucide-react';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  fileType?: 'image' | 'video' | 'audio' | 'document';
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  fileType,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>(fileType || 'all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const perPage = 12;

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open, page, filter, search]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        per_page: perPage,
      };
      
      if (filter !== 'all') {
        params.file_type = filter;
      }
      
      if (search) {
        params.search = search;
      }

      const data = await mediaApi.getMedia(params);
      setMedia(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await mediaApi.uploadMedia(formData);
      setMedia([uploaded, ...media]);
      setSelectedMedia(uploaded);
    } catch (err) {
      console.error('Failed to upload media:', err);
      alert('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMediaUrl = (m: Media) => {
    return m.public_url || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${m.storage_path}`;
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            Choose a file from your media library or upload a new one
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(val) => {
            setFilter(val);
            setPage(1);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
          <label>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={isLoading}
            />
            <Button type="button" variant="outline" disabled={isLoading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading media...
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No media files found. Upload one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((m) => (
                <div
                  key={m.id}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedMedia?.id === m.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedMedia(m)}
                >
                  {m.file_type === 'image' ? (
                    <img
                      src={getMediaUrl(m)}
                      alt={m.alt_text || m.filename}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <span className="text-xs uppercase text-muted-foreground">
                        {m.file_type}
                      </span>
                    </div>
                  )}
                  {selectedMedia?.id === m.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="p-2 bg-background">
                    <p className="text-xs truncate">{m.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(m.file_size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedMedia}>
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
