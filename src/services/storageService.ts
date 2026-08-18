import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const uploadSchoolLogo = async (orgId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "png";
  const logoRef = ref(storage, `organizations/${orgId}/branding/logo_${Date.now()}.${ext}`);
  const snapshot = await uploadBytes(logoRef, file, {
    contentType: file.type,
  });
  return await getDownloadURL(snapshot.ref);
};

export const uploadUserProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const photoRef = ref(storage, `users/${uid}/avatar_${Date.now()}.${ext}`);
  const snapshot = await uploadBytes(photoRef, file, {
    contentType: file.type,
  });
  return await getDownloadURL(snapshot.ref);
};
