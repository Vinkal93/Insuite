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
    joinedAt: new Date().toISOString() as any,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  };
  await setDoc(memberRef, memberData);

  // Create default Academic Session
  const sessionRef = doc(collection(db, "organizations", orgId, "academicSessions"));
  await setDoc(sessionRef, {
    id: sessionRef.id,
    name: "2026-27",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Update user's currentOrganizationId
  await updateDoc(doc(db, "users", userId), {
    currentOrganizationId: orgId,
    updatedAt: serverTimestamp(),
  });

  return newOrg;
};

export const autoProvisionDefaultOrganization = async (
  userId: string,
  email: string,
  displayName?: string | null
): Promise<Organization> => {
  const schoolName = displayName ? `${displayName}'s School` : "InSuite Academy";
  const randomCode = `INS${Math.floor(1000 + Math.random() * 9000)}`;

  const orgRef = doc(collection(db, "organizations"));
  const orgId = orgRef.id;

  const defaultOrg: Organization = {
    id: orgId,
    name: schoolName,
    code: randomCode,
    logoUrl: null,
    email: email || null,
    phone: null,
    alternatePhone: null,
    website: null,
    address: "Campus Main Road",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
    principalName: displayName || "Administrator",
    primaryColor: "#1E40AF",
    secondaryColor: "#F59E0B",
    setupCompleted: true,
    status: "active",
    createdBy: userId,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  };

  await setDoc(orgRef, defaultOrg);

  const memberRef = doc(db, "organizations", orgId, "members", userId);
  await setDoc(memberRef, {
    uid: userId,
    role: "OWNER",
    status: "active",
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const sessionRef = doc(collection(db, "organizations", orgId, "academicSessions"));
  await setDoc(sessionRef, {
    id: sessionRef.id,
    name: "2026-27",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(doc(db, "users", userId), {
    currentOrganizationId: orgId,
    updatedAt: serverTimestamp(),
  });

  return defaultOrg;
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
    // Fast timeout promise so collectionGroup never blocks auth resolution
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 1200)
    );

    const fetchPromise = (async () => {
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
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    return [];
  }
};
