
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

function initFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            // Use fs to read the file directly at runtime.
            // This avoids Next.js/Webpack trying to bundle the file via require().
            // process.cwd() is the project root in Next.js server environment.
            const filePath = path.join(process.cwd(), 'service-account.json');
            const fileContents = readFileSync(filePath, 'utf8');
            const serviceAccount = JSON.parse(fileContents);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin Initialized Successfully");
        } catch (error) {
            console.error("Firebase Admin Init Error:", error);
            // We throw/log but the API route calling this should handle it.
            // If this fails, the API route will error out, which is correct.
        }
    }
    return admin;
}

export function getAdminAuth() {
    const app = initFirebaseAdmin();
    return app.auth();
}

export function getAdminDb() {
    const app = initFirebaseAdmin();
    return app.firestore();
}
