"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCreateBatch, useAdjustBatch, useDeleteBatch } from "../hooks/use-inventory";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";

export function ProductBatchesDialog({ 
  product, 
  isOpen, 
  onClose 
}: { 
  product: any | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [view, setView] = useState<"list" | "add" | "adjust" | "movements">("list");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  
  const createBatch = useCreateBatch();
  const adjustBatch = useAdjustBatch();
  const deleteBatch = useDeleteBatch();
  
  // Use a query client to fetch movements dynamically
  const { useQuery } = require("@tanstack/react-query");
  const { inventoryRepository } = require("../api/inventory.repository.instance");
  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ["inventory", "movements", product?.id],
    queryFn: () => inventoryRepository.listMovements(product?.id),
    enabled: !!product?.id && view === "movements",
  });

  const [addForm, setAddForm] = useState({
    batchNumber: "",
    expiryDate: "",
    quantity: 0,
    purchaseCost: 0,
    minStock: 0,
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: 0,
    type: "MANUAL_ADJUSTMENT",
    reason: "",
  });

  if (!product) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createBatch.mutate({ ...addForm, productId: product.id }, {
      onSuccess: () => {
        toast.success("Batch added successfully");
        setView("list");
      },
      onError: (err: any) => toast.error(err.message || "Failed to add batch"),
    });
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    adjustBatch.mutate({ id: selectedBatch.id, data: adjustForm }, {
      onSuccess: () => {
        toast.success("Batch adjusted successfully");
        setView("list");
      },
      onError: (err: any) => toast.error(err.message || "Failed to adjust batch"),
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      deleteBatch.mutate(id, {
        onSuccess: () => toast.success("Batch deleted successfully"),
        onError: (err: any) => toast.error(err.message || "Failed to delete batch"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name} - Batches</DialogTitle>
          <DialogDescription>Manage inventory batches for this product.</DialogDescription>
        </DialogHeader>

        {view === "list" && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setView("movements")}>
                View Movements
              </Button>
              <Button size="sm" onClick={() => setView("add")}>
                <Plus className="mr-2 size-4" /> Add Batch
              </Button>
            </div>
            
            <Table>
              <THead>
                <TR>
                  <TH>Batch #</TH>
                  <TH>Expiry</TH>
                  <TH>Available</TH>
                  <TH>Reserved</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {product.batches?.length === 0 && (
                  <TR><TD colSpan={6} className="text-center py-4">No batches found.</TD></TR>
                )}
                {product.batches?.map((b: any) => (
                  <TR key={b.id}>
                    <TD className="font-medium">{b.batchNumber}</TD>
                    <TD>{new Date(b.expiryDate).toLocaleDateString()}</TD>
                    <TD>{b.availableQuantity}</TD>
                    <TD>{b.reservedQuantity}</TD>
                    <TD>
                      <Badge variant={b.status === 'expired' ? 'danger' : b.status === 'near_expiry' ? 'warning' : 'success'} dot>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedBatch(b); setView("adjust"); }}>
                        <Edit2 className="size-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}

        {view === "add" && (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number</label>
                <Input required value={addForm.batchNumber} onChange={e => setAddForm({...addForm, batchNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input required type="date" value={addForm.expiryDate} onChange={e => setAddForm({...addForm, expiryDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Quantity</label>
                <Input required type="number" min="0" value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Cost (per unit)</label>
                <Input required type="number" min="0" step="0.01" value={addForm.purchaseCost} onChange={e => setAddForm({...addForm, purchaseCost: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Alert Threshold</label>
                <Input type="number" min="0" value={addForm.minStock} onChange={e => setAddForm({...addForm, minStock: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button type="submit" disabled={createBatch.isPending}>
                {createBatch.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Batch
              </Button>
            </div>
          </form>
        )}

        {view === "adjust" && selectedBatch && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              Batch <strong>{selectedBatch.batchNumber}</strong> has {selectedBatch.quantity} total units ({selectedBatch.availableQuantity} available).
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Quantity</label>
                <Input 
                  required 
                  type="number" 
                  value={adjustForm.quantity} 
                  onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})}
                  placeholder="e.g. -5 for missing, +10 for found" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Reason Type</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={adjustForm.type} 
                  onChange={e => setAdjustForm({...adjustForm, type: e.target.value})}
                >
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Reason Notes</label>
                <Input value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button type="submit" disabled={adjustBatch.isPending}>
                {adjustBatch.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Apply Adjustment
              </Button>
            </div>
          </form>
        )}

        {view === "movements" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Recent Stock Movements</h3>
              <Button variant="outline" size="sm" onClick={() => setView("list")}>Back to Batches</Button>
            </div>
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Type</TH>
                  <TH>Batch #</TH>
                  <TH className="text-right">Qty Change</TH>
                  <TH>User</TH>
                </TR>
              </THead>
              <TBody>
                {loadingMovements && <TR><TD colSpan={5} className="text-center">Loading movements...</TD></TR>}
                {!loadingMovements && movements?.length === 0 && (
                  <TR><TD colSpan={5} className="text-center py-4">No movements recorded.</TD></TR>
                )}
                {!loadingMovements && movements?.map((m: any) => (
                  <TR key={m.id}>
                    <TD>{new Date(m.occurredAt).toLocaleString()}</TD>
                    <TD>
                      <Badge variant="neutral" className="capitalize">
                        {m.type.replace(/_/g, ' ')}
                      </Badge>
                    </TD>
                    <TD>{m.batchNumber}</TD>
                    <TD className={`text-right font-bold ${m.quantity > 0 ? "text-success-600" : "text-danger-600"}`}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </TD>
                    <TD className="text-muted-foreground">{m.actor}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
