export type ItemCategoryType = "Consumable" | "Fixed Asset";

export type ItemStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Inactive";

export type AssetStatus =
  | "Available"
  | "Assigned"
  | "Maintenance"
  | "Lost"
  | "Damaged"
  | "Retired";

export type AssetCondition =
  | "Brand New"
  | "Good"
  | "Fair"
  | "Needs Repair"
  | "Scrap";

export type MovementType = "StockIn" | "StockOut" | "Adjustment" | "Transfer";

export type PurchaseOrderStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";

export type AssetMaintenanceStatus =
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface AssetDocument {
  id: string;
  type: "Invoice" | "Warranty" | "Purchase Document" | "Service Document" | "Other";
  documentNumber?: string | null;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  expiryDate?: string | null;
}

export interface InventoryCategory {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: ItemCategoryType;
  description?: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLocation {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  type: "Campus" | "Building" | "Floor" | "Room" | "Lab" | "Office" | "Store" | "Other";
  description?: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  unit: string; // e.g. "Piece", "Box", "Pack", "Kg", "Liter"
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  unitCost: number;
  defaultLocationId?: string | null;
  defaultLocationName?: string | null;
  description?: string | null;
  status: ItemStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  type: MovementType;
  quantity: number; // positive for in/adjustment+, negative or positive for out
  unitCost?: number | null;
  totalCost?: number | null;
  locationId?: string | null;
  locationName?: string | null;
  referenceType?: "PurchaseOrder" | "Manual" | "Disposal" | "Transfer" | "Adjustment" | null;
  referenceId?: string | null;
  issuedTo?: string | null; // Staff name or Student name
  departmentId?: string | null;
  departmentName?: string | null;
  purpose?: string | null;
  notes?: string | null;
  balanceAfter: number;
  createdBy: string;
  actorName: string;
  createdAt: string;
}

export interface InventoryAsset {
  id: string;
  organizationId: string;
  assetCode: string; // e.g. "INS-AST-2026-000001"
  name: string;
  categoryId: string;
  categoryName: string;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  purchaseDate?: string | null; // YYYY-MM-DD
  purchasePrice?: number | null;
  warrantyExpiry?: string | null; // YYYY-MM-DD
  vendorId?: string | null;
  vendorName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  assignedToStaffId?: string | null;
  assignedToStaffName?: string | null;
  assignedToDepartment?: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  documents: AssetDocument[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AssetAssignment {
  id: string;
  organizationId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  assignmentType: "Staff" | "Department" | "Room" | "Lab" | "Office";
  staffId?: string | null;
  staffName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  effectiveDate: string; // YYYY-MM-DD
  returnDate?: string | null;
  notes?: string | null;
  status: "Active" | "Returned";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTransfer {
  id: string;
  organizationId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  fromLocationId?: string | null;
  fromLocationName?: string | null;
  toLocationId?: string | null;
  toLocationName?: string | null;
  fromStaffId?: string | null;
  fromStaffName?: string | null;
  toStaffId?: string | null;
  toStaffName?: string | null;
  transferDate: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface InventoryVendor {
  id: string;
  organizationId: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  website?: string | null;
  notes?: string | null;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  taxPercent: number;
  discountAmount: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  poNumber: string; // e.g. "PO-2026-0001"
  vendorId: string;
  vendorName: string;
  orderDate: string; // YYYY-MM-DD
  expectedDelivery?: string | null;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  status: PurchaseOrderStatus;
  notes?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  cancelledReason?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AssetMaintenanceRecord {
  id: string;
  organizationId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  issue: string;
  description?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  scheduledDate: string; // YYYY-MM-DD
  completedDate?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  status: AssetMaintenanceStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySettingsConfig {
  autoGenerateAssetCode: boolean;
  assetPrefix: string;
  nextAssetSeq: number;
  autoGeneratePoNumber: boolean;
  poPrefix: string;
  nextPoSeq: number;
  enableLowStockAlerts: boolean;
  lowStockBufferPercentage: number;
  enableDepreciation: boolean;
  depreciationMethod: "Straight Line" | "Written Down Value" | "None";
  depreciationRatePercent: number;
  defaultUnits: string[];
}

export interface InventoryDashboardStats {
  totalItems: number;
  totalAssets: number;
  lowStockItems: number;
  outOfStockItems: number;
  assignedAssets: number;
  assetsUnderMaintenance: number;
  pendingPurchaseOrders: number;
  totalInventoryValue: number;
  totalAssetPurchaseValue: number;
}
