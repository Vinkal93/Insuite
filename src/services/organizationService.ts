import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Organization, OrganizationMember } from "@/types";
import type { SchoolInfoInput, BrandingInput } from "@/schemas";

export const checkSchoolCodeAvailable = async (code: string, excludeOrgId?: string): Promise<boolean> => {
  const q = query(collection(db, "organizations"), where("code", "==", code.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return true;
  if (excludeOrgId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeOrgId) {
    return true;
  }
  return false;
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  const orgDoc = await getDoc(doc(db, "organizations", orgId));
  if (!orgDoc.exists()) return null;
  return { id: orgDoc.id, ...orgDoc.data() } as Organization;
};

export const createOrganization = async (
  userId: string,
  schoolInfo: SchoolInfoInput,
  branding?: BrandingInput
): Promise<Organization> => {
  const orgRef = doc(collection(db, "organizations"));
  const orgId = orgRef.id;

  const newOrg: Organization = {
    id: orgId,
    name: schoolInfo.name,
    code: schoolInfo.code.toUpperCase(),
    logoUrl: branding?.logoUrl || null,
    email: schoolInfo.email || null,
    phone: schoolInfo.phone || null,
    alternatePhone: schoolInfo.alternatePhone || null,
    website: schoolInfo.website || null,
    address: schoolInfo.address || null,
    city: schoolInfo.city || null,
    state: schoolInfo.state || null,
    postalCode: schoolInfo.postalCode || null,
    country: schoolInfo.country || "India",
    principalName: schoolInfo.principalName || null,
    primaryColor: branding?.primaryColor || "#1E40AF",
    secondaryColor: branding?.secondaryColor || "#F59E0B",
    setupCompleted: false,
    status: "active",
    createdBy: userId,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(orgRef, newOrg);

  // Add initial member as OWNER
  const memberRef = doc(db, "organizations", orgId, "members", userId);
  const memberData: OrganizationMember = {
    uid: userId,
    role: "OWNER",
    status: "active",
    joinedAt: serverTimestamp() as any,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };
  await setDoc(memberRef, memberData);

  // Update user's currentOrganizationId
  await updateDoc(doc(db, "users", userId), {
    currentOrganizationId: orgId,
    updatedAt: serverTimestamp(),
  });

  return newOrg;
};

export const updateOrganization = async (
  orgId: string,
  data: Partial<Organization>
): Promise<void> => {
  const orgRef = doc(db, "organizations", orgId);
  await updateDoc(orgRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getUserOrganizationMembership = async (
  orgId: string,
  uid: string
): Promise<OrganizationMember | null> => {
  const memberDoc = await getDoc(doc(db, "organizations", orgId, "members", uid));
  if (!memberDoc.exists()) return null;
  return memberDoc.data() as OrganizationMember;
};

export const getUserOrganizations = async (uid: string): Promise<Organization[]> => {
  try {
    const membersQuery = query(collectionGroup(db, "members"), where("uid", "==", uid));
    const membersSnap = await getDocs(membersQuery);
    
    const orgPromises = membersSnap.docs.map(async (memberDoc) => {
      const orgRef = memberDoc.ref.parent.parent;
      if (orgRef) {
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
          return { id: orgSnap.id, ...orgSnap.data() } as Organization;
        }
      }
      return null;
    });

    const orgs = await Promise.all(orgPromises);
    return orgs.filter((org): org is Organization => org !== null);
  } catch (err) {
    console.warn("Could not query collectionGroup members:", err);
    return [];
  }
};
