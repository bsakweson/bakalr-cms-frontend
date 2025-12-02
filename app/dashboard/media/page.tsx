'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mediaApi } from '@/lib/api';
import { Media } from '@/types';
import { MediaDetailsModal } from '@/components/media/MediaDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function MediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(searchParams?.get('type') || 'all');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
    // Update URL with type parameter
    if (selectedType !== 'all') {
      router.push(`/dashboard/media?type=${selectedType}`);
    } else {
      router.push('/dashboard/media');
    }
  }, [selectedType, router]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      
      if (selectedType !== 'all') {
        params.file_type = selectedType;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await mediaApi.getMedia(params);
      setMedia(response.items || []);
    } catch (error) {
      console.error('Failed to load media:', error);
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploadStatus('uploading');
      
      // Upload each file
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        
        await mediaApi.uploadMedia(formData);
      }
      
      setUploadStatus('success');
      
      // Reload media list
      await loadMedia();
      
      // Reset status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image')) return 'default';
    if (type.startsWith('video')) return 'secondary';
    if (type.startsWith('audio')) return 'outline';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage your media files
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          Upload Media
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Upload Status Messages */}
      {uploadStatus === 'uploading' && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Uploading files...</p>
          </CardContent>
        </Card>
      )}
      {uploadStatus === 'success' && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Upload successful!</p>
          </CardContent>
        </Card>
      )}
      {uploadStatus === 'error' && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Upload failed. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">Drop files here to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click the upload button above
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: Images, Videos, Audio, PDF, Documents
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">File Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid - Always render container for test compatibility */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading media...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="media-grid">
          {media.length > 0 ? (
            media.map((file) => (
              <Card 
                key={file.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedMedia(file);
                  setShowMediaModal(true);
                }}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {(file.thumbnail_url || file.url) && file.media_type === 'image' ? (
                    <img
                      src={file.thumbnail_url || file.url}
                      alt={file.alt_text || file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">
                      {file.media_type === 'image' ? '🖼️' : 
                       file.media_type === 'video' ? '🎥' :
                       file.media_type === 'audio' ? '🎵' : '📄'}
                    </span>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-medium truncate mb-1">{file.filename}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={getFileTypeColor(file.mime_type)} className="text-xs">
                      {file.media_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🖼️</div>
                <h3 className="text-lg font-semibold mb-2">No media files yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                  Upload your first media file by dragging and dropping or using the upload button
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Media Details Modal */}
      <MediaDetailsModal
        media={selectedMedia}
        open={showMediaModal}
        onClose={() => {
          setShowMediaModal(false);
          setSelectedMedia(null);
        }}
        onUpdate={loadMedia}
        onDelete={loadMedia}
      />
    </div>
  );
}
