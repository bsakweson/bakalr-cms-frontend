'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { inventoryApi, InventoryItemResponse, AdjustInventoryRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Package,
  AlertCircle,
  History,
  MapPin,
  DollarSign,
  Boxes,
} from 'lucide-react';

type AdjustmentType = 'RESTOCK' | 'SALE' | 'RETURN' | 'DAMAGE' | 'COUNT' | 'OTHER';

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryItemId = params.id as string;

  // State
  const [item, setItem] = useState<InventoryItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for quantity adjustment
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('COUNT');

  // Load inventory item
  const loadItem = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await inventoryApi.getItem(inventoryItemId);
      setItem(data);
      setNewQuantity(data.quantityAvailable);
    } catch (err: any) {
      console.error('Error loading inventory item:', err);
      if (err.response?.status === 404) {
        setError('Inventory item not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load inventory item');
      }
    } finally {
      setIsLoading(false);
    }
  }, [inventoryItemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // Handle save
  const handleSave = async () => {
    if (!item) return;
    
    if (!adjustmentReason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const request: AdjustInventoryRequest = {
        newQuantity,
        reason: adjustmentReason,
        adjustmentType,
      };

      await inventoryApi.adjustQuantity(inventoryItemId, request);
      setSuccess('Inventory updated successfully');
      
      // Reload item to show updated values
      await loadItem();
      setAdjustmentReason('');
    } catch (err: any) {
      console.error('Error updating inventory:', err);
      setError(err.response?.data?.message || 'Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  // Get status badge
  const getStockBadge = () => {
    if (!item) return null;
    if (item.quantityAvailable === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (item.isLowStock) {
      return <Badge variant="secondary" className="bg-amber-500 text-white">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">In Stock</Badge>;
  };

  // Calculate quantity difference
  const quantityDiff = item ? newQuantity - item.quantityAvailable : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Item</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {item?.sku}
              {getStockBadge()}
            </h1>
            <p className="text-muted-foreground">
              Inventory Item ID: {inventoryItemId}
            </p>
          </div>
        </div>
        <Button onClick={loadItem} variant="outline" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Stock Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Information
            </CardTitle>
            <CardDescription>Current inventory levels and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Available</Label>
                <p className="text-2xl font-bold">{item?.quantityAvailable || 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Reserved</Label>
                <p className="text-2xl font-bold text-amber-600">{item?.quantityReserved || 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">On Order</Label>
                <p className="text-2xl font-bold text-blue-600">{item?.quantityOnOrder || 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total</Label>
                <p className="text-2xl font-bold">{item?.totalQuantity || 0}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Reorder Level</Label>
                <p className="font-medium">{item?.reorderLevel || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Reorder Quantity</Label>
                <p className="font-medium">{item?.reorderQuantity || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Cost Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Cost
            </CardTitle>
            <CardDescription>Storage location and pricing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Location Code</Label>
                <p className="font-mono text-lg">{item?.locationCode || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Warehouse</Label>
                <p className="font-medium">{item?.warehouseId || 'Default'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium">{item?.supplierId || 'Not specified'}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Cost Price</Label>
                <p className="text-2xl font-bold">${item?.costPrice?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Total Value: ${((item?.costPrice || 0) * (item?.quantityAvailable || 0)).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Adjust Quantity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Adjust Quantity
            </CardTitle>
            <CardDescription>
              Update the available quantity for this inventory item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newQuantity">New Quantity</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  min={0}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                />
                {quantityDiff !== 0 && (
                  <p className={`text-sm ${quantityDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quantityDiff > 0 ? '+' : ''}{quantityDiff} from current ({item?.quantityAvailable})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTOCK">Restock</SelectItem>
                    <SelectItem value="SALE">Sale</SelectItem>
                    <SelectItem value="RETURN">Return</SelectItem>
                    <SelectItem value="DAMAGE">Damage/Loss</SelectItem>
                    <SelectItem value="COUNT">Inventory Count</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="reason">Reason for Adjustment *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you are adjusting the quantity..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Link href="/dashboard/inventory">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || quantityDiff === 0}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Item Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Product ID</Label>
                <p className="font-mono">{item?.productId || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Variant ID</Label>
                <p className="font-mono">{item?.variantId || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Counted</Label>
                <p>{item?.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString() : 'Never'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>{item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
