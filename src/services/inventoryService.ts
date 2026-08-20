import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  InventoryCategory,
  InventoryLocation,
  InventoryItem,
  InventoryMovement,
  InventoryAsset,
  AssetAssignment,
  AssetTransfer,
  InventoryVendor,
  PurchaseOrder,
  PurchaseOrderItem,
  AssetMaintenanceRecord,
  InventorySettingsConfig,
  InventoryDashboardStats,
  ItemCategoryType,
  ItemStatus,
  AssetStatus,
  MovementType,
  PurchaseOrderStatus,
} from "@/types/inventory";
import type {
  InventoryCategoryInput,
  InventoryLocationInput,
  InventoryItemInput,
  StockInInput,
  StockOutInput,
  StockAdjustmentInput,
  InventoryAssetInput,
  AssetAssignmentInput,
  AssetTransferInput,
  InventoryVendorInput,
  PurchaseOrderInput,
  AssetMaintenanceInput,
  InventorySettingsInput,
} from "@/schemas/inventory";
import { createAuditLog } from "./auditService";
import { getStaff } from "./hrService";

export const DEFAULT_INVENTORY_SETTINGS: InventorySettingsConfig = {
  autoGenerateAssetCode: true,
  assetPrefix: "INS-AST",
  nextAssetSeq: 1,
  autoGeneratePoNumber: true,
  poPrefix: "INS-PO",
  nextPoSeq: 1,
  enableLowStockAlerts: true,
  lowStockBufferPercentage: 10,
  enableDepreciation: false,
  depreciationMethod: "None",
  depreciationRatePercent: 10,
  defaultUnits: ["Piece", "Box", "Pack", "Kg", "Liter", "Meter", "Set"],
};

// Helper: Calculate item status based on currentStock and thresholds
export const calculateItemStatus = (
  currentStock: number,
  minimumStock: number,
  reorderLevel: number
): ItemStatus => {
  if (currentStock <= 0) return "Out of Stock";
  if (currentStock <= reorderLevel || currentStock <= minimumStock) return "Low Stock";
  return "In Stock";
};

// ----------------------------------------------------
// 1. SETTINGS
// ----------------------------------------------------

export const getInventorySettings = async (
  orgId: string
): Promise<InventorySettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "inventorySettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_INVENTORY_SETTINGS;
    return { ...DEFAULT_INVENTORY_SETTINGS, ...snap.data() } as InventorySettingsConfig;
  } catch (err) {
    console.error("getInventorySettings error:", err);
    return DEFAULT_INVENTORY_SETTINGS;
  }
};

export const updateInventorySettings = async (
  orgId: string,
  input: InventorySettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventorySettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_SETTINGS_UPDATED",
    entityType: "INVENTORY_SETTINGS",
    entityId: "config",
  });
};

// ----------------------------------------------------
// 2. CATEGORIES CRUD
// ----------------------------------------------------

export const listCategories = async (
  orgId: string,
  type?: ItemCategoryType
): Promise<InventoryCategory[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryCategories");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as InventoryCategory);

  if (type) {
    list = list.filter((c) => c.type === type);
  }
  return list;
};

export const createCategory = async (
  orgId: string,
  input: InventoryCategoryInput,
  actor: { uid: string; name: string }
): Promise<InventoryCategory> => {
  const docRef = doc(collection(db, "organizations", orgId, "inventoryCategories"));
  const now = new Date().toISOString();

  const category: InventoryCategory = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    description: input.description?.trim() || null,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, category);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_CATEGORY_CREATED",
    entityType: "INVENTORY_CATEGORY",
    entityId: docRef.id,
    metadata: { name: category.name, type: category.type },
  });

  return category;
};

export const updateCategory = async (
  orgId: string,
  categoryId: string,
  input: Partial<InventoryCategoryInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryCategories", categoryId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    code: input.code ? input.code.trim().toUpperCase() : undefined,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_CATEGORY_UPDATED",
    entityType: "INVENTORY_CATEGORY",
    entityId: categoryId,
  });
};

// ----------------------------------------------------
// 3. LOCATIONS CRUD
// ----------------------------------------------------

export const listLocations = async (orgId: string): Promise<InventoryLocation[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryLocations");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InventoryLocation);
};

export const createLocation = async (
  orgId: string,
  input: InventoryLocationInput,
  actor: { uid: string; name: string }
): Promise<InventoryLocation> => {
  const docRef = doc(collection(db, "organizations", orgId, "inventoryLocations"));
  const now = new Date().toISOString();

  const location: InventoryLocation = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    code: input.code?.trim().toUpperCase() || null,
    type: input.type,
    description: input.description?.trim() || null,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, location);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_LOCATION_CREATED",
    entityType: "INVENTORY_LOCATION",
    entityId: docRef.id,
    metadata: { name: location.name, type: location.type },
  });

  return location;
};

export const updateLocation = async (
  orgId: string,
  locationId: string,
  input: Partial<InventoryLocationInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryLocations", locationId);
  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    code: input.code ? input.code.trim().toUpperCase() : undefined,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_LOCATION_UPDATED",
    entityType: "INVENTORY_LOCATION",
    entityId: locationId,
  });
};

// ----------------------------------------------------
// 4. INVENTORY ITEMS CRUD & MOVEMENTS
// ----------------------------------------------------

export const listItems = async (
  orgId: string,
  filters?: {
    categoryId?: string;
    status?: string;
  }
): Promise<InventoryItem[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryItems");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as InventoryItem);

  if (filters?.categoryId && filters.categoryId !== "ALL") {
    list = list.filter((i) => i.categoryId === filters.categoryId);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((i) => i.status === filters.status);
  }

  return list;
};

export const getItem = async (
  orgId: string,
  itemId: string
): Promise<InventoryItem | null> => {
  const docRef = doc(db, "organizations", orgId, "inventoryItems", itemId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as InventoryItem;
};

export const createItem = async (
  orgId: string,
  input: InventoryItemInput,
  actor: { uid: string; name: string }
): Promise<InventoryItem> => {
  // Check duplicate SKU
  const existingSnap = await getDocs(
    query(
      collection(db, "organizations", orgId, "inventoryItems"),
      where("sku", "==", input.sku.trim().toUpperCase())
    )
  );
  if (!existingSnap.empty) {
    throw new Error(`An inventory item with SKU "${input.sku}" already exists.`);
  }

  // Get Category Name & Location Name
  let categoryName = "General";
  const catDoc = await getDoc(doc(db, "organizations", orgId, "inventoryCategories", input.categoryId));
  if (catDoc.exists()) categoryName = catDoc.data().name;

  let defaultLocationName: string | null = null;
  if (input.defaultLocationId) {
    const locDoc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.defaultLocationId));
    if (locDoc.exists()) defaultLocationName = locDoc.data().name;
  }

  const docRef = doc(collection(db, "organizations", orgId, "inventoryItems"));
  const now = new Date().toISOString();

  const item: InventoryItem = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    sku: input.sku.trim().toUpperCase(),
    categoryId: input.categoryId,
    categoryName,
    unit: input.unit,
    currentStock: 0,
    minimumStock: Number(input.minimumStock) || 0,
    reorderLevel: Number(input.reorderLevel) || 5,
    unitCost: Number(input.unitCost) || 0,
    defaultLocationId: input.defaultLocationId || null,
    defaultLocationName,
    description: input.description?.trim() || null,
    status: "Out of Stock",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, item);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_ITEM_CREATED",
    entityType: "INVENTORY_ITEM",
    entityId: docRef.id,
    metadata: { name: item.name, sku: item.sku },
  });

  return item;
};

export const updateItem = async (
  orgId: string,
  itemId: string,
  input: Partial<InventoryItemInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryItems", itemId);
  const now = new Date().toISOString();

  let categoryName: string | undefined = undefined;
  if (input.categoryId) {
    const catDoc = await getDoc(doc(db, "organizations", orgId, "inventoryCategories", input.categoryId));
    if (catDoc.exists()) categoryName = catDoc.data().name;
  }

  let defaultLocationName: string | undefined = undefined;
  if (input.defaultLocationId) {
    const locDoc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.defaultLocationId));
    if (locDoc.exists()) defaultLocationName = locDoc.data().name;
  }

  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    sku: input.sku ? input.sku.trim().toUpperCase() : undefined,
    categoryName,
    defaultLocationName,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "INVENTORY_ITEM_UPDATED",
    entityType: "INVENTORY_ITEM",
    entityId: itemId,
  });
};

// ----------------------------------------------------
// 5. STOCK IN / OUT / ADJUSTMENTS (TRANSACTIONS)
// ----------------------------------------------------

export const stockIn = async (
  orgId: string,
  input: StockInInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  if (input.quantity <= 0) throw new Error("Quantity must be greater than zero.");

  const itemRef = doc(db, "organizations", orgId, "inventoryItems", input.itemId);
  const movementRef = doc(collection(db, "organizations", orgId, "inventoryMovements"));
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) throw new Error("Inventory item not found.");

    const item = itemDoc.data() as InventoryItem;
    const newStock = item.currentStock + Number(input.quantity);
    const newStatus = calculateItemStatus(newStock, item.minimumStock, item.reorderLevel);

    const movement: InventoryMovement = {
      id: movementRef.id,
      organizationId: orgId,
      itemId: input.itemId,
      itemName: item.name,
      itemSku: item.sku,
      type: "StockIn",
      quantity: Number(input.quantity),
      unitCost: Number(input.unitCost) || item.unitCost,
      totalCost: (Number(input.unitCost) || item.unitCost) * Number(input.quantity),
      locationId: input.locationId || item.defaultLocationId || null,
      referenceType: input.purchaseReference ? "PurchaseOrder" : "Manual",
      referenceId: input.purchaseReference || null,
      notes: input.notes?.trim() || null,
      balanceAfter: newStock,
      createdBy: actor.uid,
      actorName: actor.name,
      createdAt: now,
    };

    transaction.set(movementRef, movement);
    transaction.update(itemRef, {
      currentStock: newStock,
      unitCost: Number(input.unitCost) > 0 ? Number(input.unitCost) : item.unitCost,
      status: newStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOCK_IN",
    entityType: "INVENTORY_MOVEMENT",
    entityId: movementRef.id,
    metadata: { itemId: input.itemId, quantity: input.quantity },
  });
};

export const stockOut = async (
  orgId: string,
  input: StockOutInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  if (input.quantity <= 0) throw new Error("Quantity must be greater than zero.");

  const itemRef = doc(db, "organizations", orgId, "inventoryItems", input.itemId);
  const movementRef = doc(collection(db, "organizations", orgId, "inventoryMovements"));
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) throw new Error("Inventory item not found.");

    const item = itemDoc.data() as InventoryItem;
    if (item.currentStock < input.quantity) {
      throw new Error(
        `Insufficient stock available. Current stock: ${item.currentStock} ${item.unit}, requested: ${input.quantity} ${item.unit}.`
      );
    }

    const newStock = item.currentStock - Number(input.quantity);
    const newStatus = calculateItemStatus(newStock, item.minimumStock, item.reorderLevel);

    const movement: InventoryMovement = {
      id: movementRef.id,
      organizationId: orgId,
      itemId: input.itemId,
      itemName: item.name,
      itemSku: item.sku,
      type: "StockOut",
      quantity: Number(input.quantity),
      unitCost: item.unitCost,
      totalCost: item.unitCost * Number(input.quantity),
      locationId: input.locationId || item.defaultLocationId || null,
      issuedTo: input.issuedTo || null,
      departmentId: input.departmentId || null,
      purpose: input.purpose,
      notes: input.notes?.trim() || null,
      balanceAfter: newStock,
      createdBy: actor.uid,
      actorName: actor.name,
      createdAt: now,
    };

    transaction.set(movementRef, movement);
    transaction.update(itemRef, {
      currentStock: newStock,
      status: newStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOCK_OUT",
    entityType: "INVENTORY_MOVEMENT",
    entityId: movementRef.id,
    metadata: { itemId: input.itemId, quantity: input.quantity, purpose: input.purpose },
  });
};

export const adjustStock = async (
  orgId: string,
  input: StockAdjustmentInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const itemRef = doc(db, "organizations", orgId, "inventoryItems", input.itemId);
  const movementRef = doc(collection(db, "organizations", orgId, "inventoryMovements"));
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) throw new Error("Inventory item not found.");

    const item = itemDoc.data() as InventoryItem;
    const diff = Number(input.newStockQuantity) - item.currentStock;
    const newStatus = calculateItemStatus(Number(input.newStockQuantity), item.minimumStock, item.reorderLevel);

    const movement: InventoryMovement = {
      id: movementRef.id,
      organizationId: orgId,
      itemId: input.itemId,
      itemName: item.name,
      itemSku: item.sku,
      type: "Adjustment",
      quantity: Math.abs(diff),
      unitCost: item.unitCost,
      totalCost: item.unitCost * Math.abs(diff),
      referenceType: "Adjustment",
      notes: `Adjustment: ${input.reason} (Previous: ${item.currentStock} -> New: ${input.newStockQuantity})`,
      balanceAfter: Number(input.newStockQuantity),
      createdBy: actor.uid,
      actorName: actor.name,
      createdAt: now,
    };

    transaction.set(movementRef, movement);
    transaction.update(itemRef, {
      currentStock: Number(input.newStockQuantity),
      status: newStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    });
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "STOCK_ADJUSTMENT",
    entityType: "INVENTORY_MOVEMENT",
    entityId: movementRef.id,
    metadata: { itemId: input.itemId, newStock: input.newStockQuantity, reason: input.reason },
  });
};

export const listMovements = async (
  orgId: string,
  filters?: {
    itemId?: string;
    type?: MovementType;
  }
): Promise<InventoryMovement[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryMovements");
  const q = query(colRef, orderBy("createdAt", "desc"), firestoreLimit(200));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as InventoryMovement);

  if (filters?.itemId && filters.itemId !== "ALL") {
    list = list.filter((m) => m.itemId === filters.itemId);
  }
  if (filters?.type) {
    list = list.filter((m) => m.type === filters.type);
  }

  return list;
};

// ----------------------------------------------------
// 6. ASSETS CRUD & BARCODE SEQUENCING
// ----------------------------------------------------

export const generateNextAssetCode = async (orgId: string): Promise<string> => {
  const settings = await getInventorySettings(orgId);
  const currentYear = new Date().getFullYear();
  const prefix = settings.assetPrefix || "INS-AST";

  // Atomically increment nextAssetSeq
  const settingsRef = doc(db, "organizations", orgId, "inventorySettings", "config");
  let nextSeq = settings.nextAssetSeq || 1;

  try {
    await updateDoc(settingsRef, {
      nextAssetSeq: nextSeq + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // If settings doc doesn't exist yet, we save it with nextSeq 2
    await setDoc(settingsRef, { ...settings, nextAssetSeq: nextSeq + 1 }, { merge: true });
  }

  const paddedSeq = String(nextSeq).padStart(6, "0");
  return `${prefix}-${currentYear}-${paddedSeq}`;
};

export const listAssets = async (
  orgId: string,
  filters?: {
    categoryId?: string;
    status?: string;
    locationId?: string;
  }
): Promise<InventoryAsset[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryAssets");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as InventoryAsset);

  if (filters?.categoryId && filters.categoryId !== "ALL") {
    list = list.filter((a) => a.categoryId === filters.categoryId);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.locationId && filters.locationId !== "ALL") {
    list = list.filter((a) => a.locationId === filters.locationId);
  }

  return list;
};

export const getAsset = async (
  orgId: string,
  assetId: string
): Promise<InventoryAsset | null> => {
  const docRef = doc(db, "organizations", orgId, "inventoryAssets", assetId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as InventoryAsset;
};

export const createAsset = async (
  orgId: string,
  input: InventoryAssetInput,
  actor: { uid: string; name: string }
): Promise<InventoryAsset> => {
  let assetCode = input.assetCode?.trim();
  if (!assetCode) {
    assetCode = await generateNextAssetCode(orgId);
  }

  // Get Category Name, Vendor Name, Location Name
  let categoryName = "Fixed Asset";
  const catDoc = await getDoc(doc(db, "organizations", orgId, "inventoryCategories", input.categoryId));
  if (catDoc.exists()) categoryName = catDoc.data().name;

  let vendorName: string | null = null;
  if (input.vendorId) {
    const vDoc = await getDoc(doc(db, "organizations", orgId, "inventoryVendors", input.vendorId));
    if (vDoc.exists()) vendorName = vDoc.data().name;
  }

  let locationName: string | null = null;
  if (input.locationId) {
    const lDoc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.locationId));
    if (lDoc.exists()) locationName = lDoc.data().name;
  }

  const docRef = doc(collection(db, "organizations", orgId, "inventoryAssets"));
  const now = new Date().toISOString();

  const asset: InventoryAsset = {
    id: docRef.id,
    organizationId: orgId,
    assetCode,
    name: input.name.trim(),
    categoryId: input.categoryId,
    categoryName,
    serialNumber: input.serialNumber?.trim() || null,
    model: input.model?.trim() || null,
    manufacturer: input.manufacturer?.trim() || null,
    purchaseDate: input.purchaseDate || null,
    purchasePrice: input.purchasePrice !== undefined && input.purchasePrice !== null ? Number(input.purchasePrice) : null,
    warrantyExpiry: input.warrantyExpiry || null,
    vendorId: input.vendorId || null,
    vendorName,
    locationId: input.locationId || null,
    locationName,
    assignedToStaffId: null,
    assignedToStaffName: null,
    assignedToDepartment: null,
    condition: input.condition || "Good",
    status: input.status || "Available",
    documents: [],
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, asset);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_CREATED",
    entityType: "INVENTORY_ASSET",
    entityId: docRef.id,
    metadata: { name: asset.name, assetCode: asset.assetCode },
  });

  return asset;
};

export const updateAsset = async (
  orgId: string,
  assetId: string,
  input: Partial<InventoryAssetInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryAssets", assetId);
  const now = new Date().toISOString();

  let categoryName: string | undefined = undefined;
  if (input.categoryId) {
    const catDoc = await getDoc(doc(db, "organizations", orgId, "inventoryCategories", input.categoryId));
    if (catDoc.exists()) categoryName = catDoc.data().name;
  }

  let locationName: string | undefined = undefined;
  if (input.locationId) {
    const lDoc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.locationId));
    if (lDoc.exists()) locationName = lDoc.data().name;
  }

  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    categoryName,
    locationName,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_UPDATED",
    entityType: "INVENTORY_ASSET",
    entityId: assetId,
  });
};

export const uploadAssetDocument = async (
  orgId: string,
  assetId: string,
  docType: "Invoice" | "Warranty" | "Purchase Document" | "Service Document" | "Other",
  documentNumber: string,
  expiryDate: string,
  file: File,
  actor: { uid: string; name: string }
): Promise<void> => {
  const asset = await getAsset(orgId, assetId);
  if (!asset) throw new Error("Asset not found.");

  const fileExt = file.name.split(".").pop();
  const sanitizedName = `${Date.now()}_${docType.toLowerCase()}.${fileExt}`;
  const storagePath = `organizations/${orgId}/inventoryAssets/${assetId}/documents/${sanitizedName}`;
  const fileRef = ref(storage, storagePath);
  const snap = await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(snap.ref);

  const docId = `doc_${Date.now()}`;
  const newDoc = {
    id: docId,
    type: docType,
    documentNumber: documentNumber.trim() || null,
    fileUrl: downloadUrl,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    expiryDate: expiryDate || null,
  };

  const updatedDocs = [...(asset.documents || []), newDoc];
  await updateDoc(doc(db, "organizations", orgId, "inventoryAssets", assetId), {
    documents: updatedDocs,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_DOCUMENT_UPLOADED",
    entityType: "INVENTORY_ASSET",
    entityId: assetId,
    metadata: { docType, fileName: file.name },
  });
};

export const deleteAssetDocument = async (
  orgId: string,
  assetId: string,
  docId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const asset = await getAsset(orgId, assetId);
  if (!asset) throw new Error("Asset not found.");

  const docToDelete = (asset.documents || []).find((d) => d.id === docId);
  if (!docToDelete) return;

  if (docToDelete.fileUrl) {
    try {
      const fileRef = ref(storage, docToDelete.fileUrl);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Storage delete error:", err);
    }
  }

  const updatedDocs = (asset.documents || []).filter((d) => d.id !== docId);
  await updateDoc(doc(db, "organizations", orgId, "inventoryAssets", assetId), {
    documents: updatedDocs,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_DOCUMENT_DELETED",
    entityType: "INVENTORY_ASSET",
    entityId: assetId,
    metadata: { docId },
  });
};

// ----------------------------------------------------
// 7. ASSET ASSIGNMENT & TRANSFERS
// ----------------------------------------------------

export const listAssetAssignments = async (
  orgId: string,
  assetId?: string
): Promise<AssetAssignment[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryAssignments");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as AssetAssignment);

  if (assetId) {
    list = list.filter((a) => a.assetId === assetId);
  }
  return list;
};

export const assignAsset = async (
  orgId: string,
  input: AssetAssignmentInput,
  actor: { uid: string; name: string }
): Promise<AssetAssignment> => {
  const asset = await getAsset(orgId, input.assetId);
  if (!asset) throw new Error("Asset not found.");
  if (asset.status === "Assigned") {
    throw new Error(`Asset ${asset.name} is already assigned to ${asset.assignedToStaffName || "another custodian"}.`);
  }
  if (asset.status === "Maintenance" || asset.status === "Lost" || asset.status === "Retired") {
    throw new Error(`Asset cannot be assigned while in status "${asset.status}".`);
  }

  let staffName: string | null = null;
  if (input.staffId) {
    const staff = await getStaff(orgId, input.staffId);
    if (staff) staffName = staff.fullName;
  }

  let locationName: string | null = null;
  if (input.locationId) {
    const loc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.locationId));
    if (loc.exists()) locationName = loc.data().name;
  }

  const docRef = doc(collection(db, "organizations", orgId, "inventoryAssignments"));
  const now = new Date().toISOString();

  const assignment: AssetAssignment = {
    id: docRef.id,
    organizationId: orgId,
    assetId: input.assetId,
    assetCode: asset.assetCode,
    assetName: asset.name,
    assignmentType: input.assignmentType,
    staffId: input.staffId || null,
    staffName,
    departmentId: input.departmentId || null,
    departmentName: input.departmentId || null,
    locationId: input.locationId || null,
    locationName,
    effectiveDate: input.effectiveDate,
    returnDate: null,
    notes: input.notes?.trim() || null,
    status: "Active",
    createdBy: actor.uid,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(docRef, assignment);
  batch.update(doc(db, "organizations", orgId, "inventoryAssets", input.assetId), {
    status: "Assigned",
    assignedToStaffId: input.staffId || null,
    assignedToStaffName: staffName,
    assignedToDepartment: input.departmentId || null,
    locationId: input.locationId || asset.locationId,
    locationName: locationName || asset.locationName,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_ASSIGNED",
    entityType: "INVENTORY_ASSIGNMENT",
    entityId: docRef.id,
    metadata: { assetCode: asset.assetCode, staffName },
  });

  return assignment;
};

export const returnAsset = async (
  orgId: string,
  assignmentId: string,
  returnDate: string,
  notes: string | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const assignRef = doc(db, "organizations", orgId, "inventoryAssignments", assignmentId);
  const snap = await getDoc(assignRef);
  if (!snap.exists()) return;

  const assign = snap.data() as AssetAssignment;
  const now = new Date().toISOString();

  const batch = writeBatch(db);
  batch.update(assignRef, {
    status: "Returned",
    returnDate,
    notes: notes ? `${assign.notes || ""}\nReturn Note: ${notes}` : assign.notes,
    updatedAt: now,
  });

  batch.update(doc(db, "organizations", orgId, "inventoryAssets", assign.assetId), {
    status: "Available",
    assignedToStaffId: null,
    assignedToStaffName: null,
    assignedToDepartment: null,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_UNASSIGNED",
    entityType: "INVENTORY_ASSIGNMENT",
    entityId: assignmentId,
    metadata: { assetCode: assign.assetCode },
  });
};

export const listAssetTransfers = async (
  orgId: string,
  assetId?: string
): Promise<AssetTransfer[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryTransfers");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as AssetTransfer);

  if (assetId) {
    list = list.filter((t) => t.assetId === assetId);
  }
  return list;
};

export const transferAsset = async (
  orgId: string,
  input: AssetTransferInput,
  actor: { uid: string; name: string }
): Promise<AssetTransfer> => {
  const asset = await getAsset(orgId, input.assetId);
  if (!asset) throw new Error("Asset not found.");

  let toLocationName: string | null = null;
  if (input.toLocationId) {
    const loc = await getDoc(doc(db, "organizations", orgId, "inventoryLocations", input.toLocationId));
    if (loc.exists()) toLocationName = loc.data().name;
  }

  let toStaffName: string | null = null;
  if (input.toStaffId) {
    const staff = await getStaff(orgId, input.toStaffId);
    if (staff) toStaffName = staff.fullName;
  }

  const docRef = doc(collection(db, "organizations", orgId, "inventoryTransfers"));
  const now = new Date().toISOString();

  const transfer: AssetTransfer = {
    id: docRef.id,
    organizationId: orgId,
    assetId: input.assetId,
    assetCode: asset.assetCode,
    assetName: asset.name,
    fromLocationId: asset.locationId || null,
    fromLocationName: asset.locationName || null,
    toLocationId: input.toLocationId || asset.locationId || null,
    toLocationName: toLocationName || asset.locationName || null,
    fromStaffId: asset.assignedToStaffId || null,
    fromStaffName: asset.assignedToStaffName || null,
    toStaffId: input.toStaffId || asset.assignedToStaffId || null,
    toStaffName: toStaffName || asset.assignedToStaffName || null,
    transferDate: input.transferDate,
    reason: input.reason.trim(),
    createdBy: actor.uid,
    createdAt: now,
  };

  const batch = writeBatch(db);
  batch.set(docRef, transfer);
  batch.update(doc(db, "organizations", orgId, "inventoryAssets", input.assetId), {
    locationId: transfer.toLocationId,
    locationName: transfer.toLocationName,
    assignedToStaffId: transfer.toStaffId,
    assignedToStaffName: transfer.toStaffName,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_TRANSFERRED",
    entityType: "INVENTORY_TRANSFER",
    entityId: docRef.id,
    metadata: { assetCode: asset.assetCode, reason: transfer.reason },
  });

  return transfer;
};

// ----------------------------------------------------
// 8. VENDORS CRUD
// ----------------------------------------------------

export const listVendors = async (orgId: string): Promise<InventoryVendor[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryVendors");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InventoryVendor);
};

export const getVendor = async (
  orgId: string,
  vendorId: string
): Promise<InventoryVendor | null> => {
  const docRef = doc(db, "organizations", orgId, "inventoryVendors", vendorId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as InventoryVendor;
};

export const createVendor = async (
  orgId: string,
  input: InventoryVendorInput,
  actor: { uid: string; name: string }
): Promise<InventoryVendor> => {
  const docRef = doc(collection(db, "organizations", orgId, "inventoryVendors"));
  const now = new Date().toISOString();

  const vendor: InventoryVendor = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name.trim(),
    contactPerson: input.contactPerson?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    gstin: input.gstin?.trim()?.toUpperCase() || null,
    website: input.website?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, vendor);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VENDOR_CREATED",
    entityType: "INVENTORY_VENDOR",
    entityId: docRef.id,
    metadata: { name: vendor.name },
  });

  return vendor;
};

export const updateVendor = async (
  orgId: string,
  vendorId: string,
  input: Partial<InventoryVendorInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryVendors", vendorId);
  await updateDoc(docRef, {
    ...input,
    name: input.name ? input.name.trim() : undefined,
    gstin: input.gstin ? input.gstin.trim().toUpperCase() : undefined,
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "VENDOR_UPDATED",
    entityType: "INVENTORY_VENDOR",
    entityId: vendorId,
  });
};

// ----------------------------------------------------
// 9. PURCHASE ORDERS WORKFLOW
// ----------------------------------------------------

export const generateNextPoNumber = async (orgId: string): Promise<string> => {
  const settings = await getInventorySettings(orgId);
  const currentYear = new Date().getFullYear();
  const prefix = settings.poPrefix || "INS-PO";

  const settingsRef = doc(db, "organizations", orgId, "inventorySettings", "config");
  let nextSeq = settings.nextPoSeq || 1;

  try {
    await updateDoc(settingsRef, {
      nextPoSeq: nextSeq + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    await setDoc(settingsRef, { ...settings, nextPoSeq: nextSeq + 1 }, { merge: true });
  }

  const paddedSeq = String(nextSeq).padStart(4, "0");
  return `${prefix}-${currentYear}-${paddedSeq}`;
};

export const listPurchaseOrders = async (
  orgId: string,
  filters?: {
    status?: PurchaseOrderStatus;
    vendorId?: string;
  }
): Promise<PurchaseOrder[]> => {
  const colRef = collection(db, "organizations", orgId, "purchaseOrders");
  const q = query(colRef, orderBy("orderDate", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as PurchaseOrder);

  if (filters?.status && filters.status !== ("ALL" as any)) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.vendorId && filters.vendorId !== "ALL") {
    list = list.filter((p) => p.vendorId === filters.vendorId);
  }

  return list;
};

export const getPurchaseOrder = async (
  orgId: string,
  orderId: string
): Promise<PurchaseOrder | null> => {
  const docRef = doc(db, "organizations", orgId, "purchaseOrders", orderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as PurchaseOrder;
};

export const createPurchaseOrder = async (
  orgId: string,
  input: PurchaseOrderInput,
  actor: { uid: string; name: string }
): Promise<PurchaseOrder> => {
  const vendor = await getVendor(orgId, input.vendorId);
  if (!vendor) throw new Error("Vendor not found.");

  const poNumber = await generateNextPoNumber(orgId);
  const now = new Date().toISOString();

  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  const items: PurchaseOrderItem[] = input.items.map((it) => {
    const lineSubtotal = Number(it.quantity) * Number(it.unitCost);
    const lineDiscount = Number(it.discountAmount) || 0;
    const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);
    const lineTax = (lineTaxable * (Number(it.taxPercent) || 0)) / 100;
    const lineTotal = lineTaxable + lineTax;

    subtotal += lineSubtotal;
    discountTotal += lineDiscount;
    taxTotal += lineTax;

    return {
      itemId: it.itemId,
      itemName: it.itemName,
      itemSku: it.itemSku,
      quantity: Number(it.quantity),
      receivedQuantity: 0,
      unitCost: Number(it.unitCost),
      taxPercent: Number(it.taxPercent) || 0,
      discountAmount: lineDiscount,
      total: Math.round(lineTotal * 100) / 100,
    };
  });

  const total = Math.max(0, subtotal - discountTotal + taxTotal);

  const docRef = doc(collection(db, "organizations", orgId, "purchaseOrders"));
  const po: PurchaseOrder = {
    id: docRef.id,
    organizationId: orgId,
    poNumber,
    vendorId: input.vendorId,
    vendorName: vendor.name,
    orderDate: input.orderDate,
    expectedDelivery: input.expectedDelivery || null,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    status: "Draft",
    notes: input.notes?.trim() || null,
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    cancelledReason: null,
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, po);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PURCHASE_ORDER_CREATED",
    entityType: "PURCHASE_ORDER",
    entityId: docRef.id,
    metadata: { poNumber: po.poNumber, total: po.total },
  });

  return po;
};

export const updatePurchaseOrderStatus = async (
  orgId: string,
  orderId: string,
  status: PurchaseOrderStatus,
  actor: { uid: string; name: string },
  notes?: string
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "purchaseOrders", orderId);
  const now = new Date().toISOString();

  const updatePayload: any = {
    status,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  if (status === "Approved") {
    updatePayload.approvedBy = actor.uid;
    updatePayload.approvedByName = actor.name;
    updatePayload.approvedAt = now;
  }
  if (status === "Cancelled" && notes) {
    updatePayload.cancelledReason = notes;
  }

  await updateDoc(docRef, updatePayload);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action:
      status === "Approved"
        ? "PURCHASE_ORDER_APPROVED"
        : status === "Cancelled"
        ? "PURCHASE_ORDER_CANCELLED"
        : "PURCHASE_ORDER_SUBMITTED",
    entityType: "PURCHASE_ORDER",
    entityId: orderId,
    metadata: { status },
  });
};

export const receivePurchaseOrder = async (
  orgId: string,
  orderId: string,
  receivedItems: { itemId: string; receivedQty: number }[],
  actor: { uid: string; name: string }
): Promise<void> => {
  const poRef = doc(db, "organizations", orgId, "purchaseOrders", orderId);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const poDoc = await transaction.get(poRef);
    if (!poDoc.exists()) throw new Error("Purchase Order not found.");

    const po = poDoc.data() as PurchaseOrder;
    if (po.status !== "Approved" && po.status !== "Ordered" && po.status !== "Partially Received") {
      throw new Error(`Cannot receive items for Purchase Order in "${po.status}" status.`);
    }

    let allFullyReceived = true;
    const updatedItems = po.items.map((item) => {
      const match = receivedItems.find((r) => r.itemId === item.itemId);
      const addQty = match ? Number(match.receivedQty) || 0 : 0;
      const newRecQty = item.receivedQuantity + addQty;

      if (newRecQty > item.quantity) {
        throw new Error(
          `Received quantity for "${item.itemName}" (${newRecQty}) cannot exceed ordered quantity (${item.quantity}).`
        );
      }

      if (newRecQty < item.quantity) {
        allFullyReceived = false;
      }

      return {
        ...item,
        receivedQuantity: newRecQty,
      };
    });

    const newStatus: PurchaseOrderStatus = allFullyReceived ? "Received" : "Partially Received";

    transaction.update(poRef, {
      items: updatedItems,
      status: newStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    });

    // Update each received item's inventory stock & ledger
    for (const rec of receivedItems) {
      if (rec.receivedQty > 0) {
        const itemRef = doc(db, "organizations", orgId, "inventoryItems", rec.itemId);
        const itemDoc = await transaction.get(itemRef);
        if (itemDoc.exists()) {
          const it = itemDoc.data() as InventoryItem;
          const newStock = it.currentStock + Number(rec.receivedQty);
          const newItStatus = calculateItemStatus(newStock, it.minimumStock, it.reorderLevel);

          const movRef = doc(collection(db, "organizations", orgId, "inventoryMovements"));
          const movement: InventoryMovement = {
            id: movRef.id,
            organizationId: orgId,
            itemId: it.id,
            itemName: it.name,
            itemSku: it.sku,
            type: "StockIn",
            quantity: Number(rec.receivedQty),
            unitCost: it.unitCost,
            totalCost: it.unitCost * Number(rec.receivedQty),
            locationId: it.defaultLocationId || null,
            referenceType: "PurchaseOrder",
            referenceId: po.poNumber,
            notes: `Received via Purchase Order ${po.poNumber}`,
            balanceAfter: newStock,
            createdBy: actor.uid,
            actorName: actor.name,
            createdAt: now,
          };

          transaction.set(movRef, movement);
          transaction.update(itemRef, {
            currentStock: newStock,
            status: newItStatus,
            updatedAt: now,
            updatedBy: actor.uid,
          });
        }
      }
    }
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PURCHASE_ORDER_RECEIVED",
    entityType: "PURCHASE_ORDER",
    entityId: orderId,
    metadata: { receivedCount: receivedItems.length },
  });
};

// ----------------------------------------------------
// 10. ASSET MAINTENANCE
// ----------------------------------------------------

export const listAssetMaintenance = async (
  orgId: string,
  assetId?: string
): Promise<AssetMaintenanceRecord[]> => {
  const colRef = collection(db, "organizations", orgId, "inventoryMaintenance");
  const q = query(colRef, orderBy("scheduledDate", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as AssetMaintenanceRecord);

  if (assetId) {
    list = list.filter((m) => m.assetId === assetId);
  }
  return list;
};

export const createAssetMaintenance = async (
  orgId: string,
  input: AssetMaintenanceInput,
  actor: { uid: string; name: string }
): Promise<AssetMaintenanceRecord> => {
  const asset = await getAsset(orgId, input.assetId);
  if (!asset) throw new Error("Asset not found.");

  let vendorName: string | null = null;
  if (input.vendorId) {
    const vDoc = await getDoc(doc(db, "organizations", orgId, "inventoryVendors", input.vendorId));
    if (vDoc.exists()) vendorName = vDoc.data().name;
  }

  const docRef = doc(collection(db, "organizations", orgId, "inventoryMaintenance"));
  const now = new Date().toISOString();

  const record: AssetMaintenanceRecord = {
    id: docRef.id,
    organizationId: orgId,
    assetId: input.assetId,
    assetCode: asset.assetCode,
    assetName: asset.name,
    issue: input.issue.trim(),
    description: input.description?.trim() || null,
    vendorId: input.vendorId || null,
    vendorName,
    scheduledDate: input.scheduledDate,
    completedDate: null,
    estimatedCost: input.estimatedCost ? Number(input.estimatedCost) : null,
    actualCost: null,
    status: "Scheduled",
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(docRef, record);
  batch.update(doc(db, "organizations", orgId, "inventoryAssets", input.assetId), {
    status: "Maintenance",
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_MAINTENANCE_CREATED",
    entityType: "INVENTORY_MAINTENANCE",
    entityId: docRef.id,
    metadata: { assetCode: asset.assetCode, issue: record.issue },
  });

  return record;
};

export const completeAssetMaintenance = async (
  orgId: string,
  maintenanceId: string,
  actualCost: number,
  completedDate: string,
  notes: string | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "inventoryMaintenance", maintenanceId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const m = snap.data() as AssetMaintenanceRecord;
  const asset = await getAsset(orgId, m.assetId);
  const now = new Date().toISOString();

  // Restore asset status based on whether it has an active custodian
  const restoredStatus: AssetStatus = asset?.assignedToStaffId ? "Assigned" : "Available";

  const batch = writeBatch(db);
  batch.update(docRef, {
    status: "Completed",
    actualCost: Number(actualCost),
    completedDate,
    notes: notes || undefined,
    updatedAt: now,
  });

  if (asset) {
    batch.update(doc(db, "organizations", orgId, "inventoryAssets", m.assetId), {
      status: restoredStatus,
      updatedAt: now,
      updatedBy: actor.uid,
    });
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ASSET_MAINTENANCE_COMPLETED",
    entityType: "INVENTORY_MAINTENANCE",
    entityId: maintenanceId,
    metadata: { assetCode: m.assetCode, actualCost },
  });
};

// ----------------------------------------------------
// 11. DASHBOARD METRICS
// ----------------------------------------------------

export const getInventoryDashboardStats = async (
  orgId: string
): Promise<InventoryDashboardStats> => {
  const [itemsSnap, assetsSnap, poSnap] = await Promise.all([
    getDocs(collection(db, "organizations", orgId, "inventoryItems")),
    getDocs(collection(db, "organizations", orgId, "inventoryAssets")),
    getDocs(
      query(
        collection(db, "organizations", orgId, "purchaseOrders"),
        where("status", "in", ["Draft", "Submitted", "Approved", "Ordered"])
      )
    ),
  ]);

  const items = itemsSnap.docs.map((d) => d.data() as InventoryItem);
  const assets = assetsSnap.docs.map((d) => d.data() as InventoryAsset);

  const totalItems = items.length;
  const lowStockItems = items.filter((i) => i.status === "Low Stock").length;
  const outOfStockItems = items.filter((i) => i.status === "Out of Stock").length;
  const totalInventoryValue = items.reduce(
    (acc, i) => acc + (Number(i.currentStock) || 0) * (Number(i.unitCost) || 0),
    0
  );

  const totalAssets = assets.length;
  const assignedAssets = assets.filter((a) => a.status === "Assigned").length;
  const assetsUnderMaintenance = assets.filter((a) => a.status === "Maintenance").length;
  const totalAssetPurchaseValue = assets.reduce(
    (acc, a) => acc + (Number(a.purchasePrice) || 0),
    0
  );

  const pendingPurchaseOrders = poSnap.size;

  return {
    totalItems,
    totalAssets,
    lowStockItems,
    outOfStockItems,
    assignedAssets,
    assetsUnderMaintenance,
    pendingPurchaseOrders,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    totalAssetPurchaseValue: Math.round(totalAssetPurchaseValue * 100) / 100,
  };
};
