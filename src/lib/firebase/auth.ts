import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

// Ensure local browser persistence so user session is maintained across refreshes and tab reopens
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Failed to set auth persistence:", err);
  });
}
