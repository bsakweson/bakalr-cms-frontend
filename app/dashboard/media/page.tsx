'use client';

import { useEffect, useState, useRef } from 'react';
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

interface MediaFile {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  public_url?: string;
  alt_text?: string;
  thumbnail_url?: string;
  created_at: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, [selectedType]);

  const loadMedia = async () => {
    setIsLoading(true);
    // TODO: Implement API call to fetch media
    // For now, showing placeholder
    setTimeout(() => {
      setMedia([]);
      setIsLoading(false);
    }, 500);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    // TODO: Implement file upload
    console.log('Files selected:', Array.from(files).map(f => f.name));
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

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading media...</div>
        </div>
      ) : media.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {media.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {file.thumbnail_url ? (
                  <img
                    src={file.thumbnail_url}
                    alt={file.alt_text || file.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {file.file_type.startsWith('image') ? '🖼️' : 
                     file.file_type.startsWith('video') ? '🎥' :
                     file.file_type.startsWith('audio') ? '🎵' : '📄'}
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <p className="text-sm font-medium truncate mb-1">{file.filename}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={getFileTypeColor(file.file_type)} className="text-xs">
                    {file.file_type.split('/')[0]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
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
  );
}
