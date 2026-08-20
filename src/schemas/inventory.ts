import { z } from "zod";

export const inventoryCategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  code: z.string().min(2, "Category code is required"),
  type: z.enum(["Consumable", "Fixed Asset"]).default("Consumable"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type InventoryCategoryInput = z.infer<typeof inventoryCategorySchema>;

export const inventoryLocationSchema = z.object({
  name: z.string().min(2, "Location name is required"),
  code: z.string().optional().nullable(),
  type: z.enum(["Campus", "Building", "Floor", "Room", "Lab", "Office", "Store", "Other"]).default("Room"),
  description: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type InventoryLocationInput = z.infer<typeof inventoryLocationSchema>;

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  sku: z.string().min(2, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit of measure is required"),
  minimumStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(5),
  unitCost: z.number().min(0).default(0),
  defaultLocationId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["In Stock", "Low Stock", "Out of Stock", "Inactive"]).default("In Stock"),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const stockInSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  date: z.string().min(1, "Date is required"),
  vendorId: z.string().optional().nullable(),
  purchaseReference: z.string().optional().nullable(),
  unitCost: z.number().min(0).default(0),
  locationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StockInInput = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  date: z.string().min(1, "Date is required"),
  issuedTo: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  purpose: z.string().min(2, "Purpose of issuance is required"),
  locationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;

export const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  newStockQuantity: z.number().min(0, "New stock quantity cannot be negative"),
  reason: z.string().min(3, "Reason for stock adjustment is required"),
  date: z.string().min(1, "Date is required"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const inventoryAssetSchema = z.object({
  assetCode: z.string().optional(), // Auto-generated if empty
  name: z.string().min(2, "Asset name is required"),
  categoryId: z.string().min(1, "Asset category is required"),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  condition: z.enum(["Brand New", "Good", "Fair", "Needs Repair", "Scrap"]).default("Good"),
  status: z.enum(["Available", "Assigned", "Maintenance", "Lost", "Damaged", "Retired"]).default("Available"),
});

export type InventoryAssetInput = z.infer<typeof inventoryAssetSchema>;

export const assetAssignmentSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  assignmentType: z.enum(["Staff", "Department", "Room", "Lab", "Office"]).default("Staff"),
  staffId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  effectiveDate: z.string().min(1, "Effective date is required"),
  notes: z.string().optional().nullable(),
});

export type AssetAssignmentInput = z.infer<typeof assetAssignmentSchema>;

export const assetTransferSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  toLocationId: z.string().optional().nullable(),
  toStaffId: z.string().optional().nullable(),
  transferDate: z.string().min(1, "Transfer date is required"),
  reason: z.string().min(3, "Transfer reason is required"),
});

export type AssetTransferInput = z.infer<typeof assetTransferSchema>;

export const inventoryVendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type InventoryVendorInput = z.infer<typeof inventoryVendorSchema>;

export const purchaseOrderItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  itemName: z.string().min(1),
  itemSku: z.string().min(1),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost cannot be negative"),
  taxPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
});

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDelivery: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required in the PO"),
  notes: z.string().optional().nullable(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const assetMaintenanceSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  issue: z.string().min(3, "Issue title is required"),
  description: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  estimatedCost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AssetMaintenanceInput = z.infer<typeof assetMaintenanceSchema>;

export const inventorySettingsSchema = z.object({
  autoGenerateAssetCode: z.boolean().default(true),
  assetPrefix: z.string().default("INS-AST"),
  nextAssetSeq: z.number().min(1).default(1),
  autoGeneratePoNumber: z.boolean().default(true),
  poPrefix: z.string().default("INS-PO"),
  nextPoSeq: z.number().min(1).default(1),
  enableLowStockAlerts: z.boolean().default(true),
  lowStockBufferPercentage: z.number().min(0).max(100).default(10),
  enableDepreciation: z.boolean().default(false),
  depreciationMethod: z.enum(["Straight Line", "Written Down Value", "None"]).default("None"),
  depreciationRatePercent: z.number().min(0).max(100).default(10),
  defaultUnits: z.array(z.string()).default(["Piece", "Box", "Pack", "Kg", "Liter", "Meter", "Set"]),
});

export type InventorySettingsInput = z.infer<typeof inventorySettingsSchema>;
