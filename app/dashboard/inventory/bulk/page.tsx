'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inventoryApi, BulkUpdateRequest, BulkUpdateResponse, BulkUpdateItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ParsedItem extends BulkUpdateItem {
  valid: boolean;
  error?: string;
}

export default function BulkUpdatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [reason, setReason] = useState('Bulk inventory update');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkUpdateResponse | null>(null);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const parsed = parseCSV(csv);
        setItems(parsed);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  // Parse CSV content
  const parseCSV = (csv: string): ParsedItem[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const skuIndex = header.indexOf('sku');
    const qtyIndex = header.findIndex(h => h === 'quantity' || h === 'qty' || h === 'new_quantity');

    if (skuIndex === -1) {
      throw new Error('CSV must have a "sku" column');
    }
    if (qtyIndex === -1) {
      throw new Error('CSV must have a "quantity" or "qty" column');
    }

    const parsed: ParsedItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const sku = values[skuIndex];
      const qtyStr = values[qtyIndex];
      const quantity = parseInt(qtyStr, 10);

      if (!sku) {
        parsed.push({
          sku: '',
          newQuantity: 0,
          valid: false,
          error: `Row ${i + 1}: Missing SKU`,
        });
        continue;
      }

      if (isNaN(quantity) || quantity < 0) {
        parsed.push({
          sku,
          newQuantity: 0,
          valid: false,
          error: `Row ${i + 1}: Invalid quantity "${qtyStr}"`,
        });
        continue;
      }

      parsed.push({
        sku,
        newQuantity: quantity,
        valid: true,
      });
    }

    return parsed;
  };

  // Handle manual item entry
  const handleAddManualItem = () => {
    setItems([
      ...items,
      { sku: '', newQuantity: 0, valid: false, error: 'SKU required' },
    ]);
  };

  // Update manual item
  const handleUpdateItem = (index: number, field: 'sku' | 'newQuantity', value: string | number) => {
    const newItems = [...items];
    if (field === 'sku') {
      newItems[index].sku = value as string;
      newItems[index].valid = !!(value as string).trim();
      newItems[index].error = newItems[index].valid ? undefined : 'SKU required';
    } else {
      const qty = typeof value === 'number' ? value : parseInt(value, 10);
      newItems[index].newQuantity = isNaN(qty) ? 0 : qty;
    }
    setItems(newItems);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Process bulk update
  const handleProcess = async () => {
    const validItems = items.filter(item => item.valid);
    if (validItems.length === 0) {
      setError('No valid items to process');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the bulk update');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const request: BulkUpdateRequest = {
        items: validItems.map(({ sku, newQuantity }) => ({ sku, newQuantity })),
        reason: reason.trim(),
      };

      const response = await inventoryApi.bulkUpdate(request);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bulk update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const csv = 'sku,quantity\nSKU-001,100\nSKU-002,50\nSKU-003,75';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-update-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Count valid/invalid items
  const validCount = items.filter(i => i.valid).length;
  const invalidCount = items.filter(i => !i.valid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Inventory Update</h1>
          <p className="text-muted-foreground">
            Upload a CSV file or manually enter items to update
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className={result.failed > 0 ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'}>
          <AlertDescription className={result.failed > 0 ? 'text-amber-700' : 'text-green-700'}>
            <div className="flex items-center gap-2">
              {result.failed > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>
                Bulk update complete: {result.successful} successful, {result.failed} failed
              </span>
            </div>
            {result.errors?.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {result.errors.map((err, i) => (
                  <li key={i}>{err.sku}: {err.error}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file with SKU and quantity columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Click to upload CSV</p>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleDownloadSample}>
              <Download className="mr-2 h-4 w-4" />
              Download Sample Template
            </Button>

            <p className="text-xs text-muted-foreground">
              CSV must have columns: <code>sku</code>, <code>quantity</code> (or <code>qty</code>)
            </p>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Update Settings</CardTitle>
            <CardDescription>Configure the bulk update operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Weekly inventory count, Shipment received..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span>Items to process:</span>
              <span className="font-medium">{validCount}</span>
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center justify-between text-sm text-amber-600">
                <span>Invalid items:</span>
                <span className="font-medium">{invalidCount}</span>
              </div>
            )}

            <Button 
              className="w-full" 
              disabled={validCount === 0 || isProcessing || !reason.trim()}
              onClick={handleProcess}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Process {validCount} Items
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Items Preview</CardTitle>
            <CardDescription>
              Review items before processing. Invalid items will be skipped.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddManualItem}>
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items loaded</p>
              <p className="text-sm">Upload a CSV or add items manually</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">New Quantity</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {item.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.sku}
                        onChange={(e) => handleUpdateItem(index, 'sku', e.target.value)}
                        className="h-8 font-mono"
                        placeholder="SKU-001"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        value={item.newQuantity}
                        onChange={(e) => handleUpdateItem(index, 'newQuantity', e.target.value)}
                        className="h-8 w-24 ml-auto text-right"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-red-600">
                      {item.error}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
