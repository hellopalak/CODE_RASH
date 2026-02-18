import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export const ALLOWED_USERS = [
    "user1@example.com",
    "user2@example.com",
    "advancedlooser70@gmail.com",
    "parv@gmail.com",
];

export const ALLOWED_EVALUATORS = [
    "evaluator@example.com",
];

export const ALLOWED_ADMINS = [
    "admin@example.com",
    "palak@example.com"
];

/**
 * Checks if an email is authorized for a specific role.
 * Uses Firestore 'allowed_users' collection (Doc ID = email).
 * Fallback to static list for Admins to prevent lockout.
 */
export const checkAccess = async (email: string, role: string): Promise<boolean> => {
    // 1. Static Fallback (Critical for Admin access if DB fails/is empty)
    if (role === 'admin' && ALLOWED_ADMINS.includes(email)) return true;

    try {
        // Check Firestore: allowed_users/{email} -> { role: "user" }
        const docRef = doc(db, "allowed_users", email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Check Role (Admin in DB grants access to everything basically, or specific role match)
            if ((data.role === role) || (data.role === 'admin')) {
                return true;
            }
        }
    } catch (error) {
        console.error("Error checking allowlist:", error);
    }

    return false;
};
