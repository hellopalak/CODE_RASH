
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

function initFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            let serviceAccount: object;

            if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                // Production (Railway): loaded from environment variable
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            } else {
                // Local dev: read from service-account.json file on disk
                // process.cwd() is the project root in Next.js server environment.
                const filePath = path.join(process.cwd(), 'service-account.json');
                const fileContents = readFileSync(filePath, 'utf8');
                serviceAccount = JSON.parse(fileContents);
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
            });
            console.log("Firebase Admin Initialized Successfully");
        } catch (error) {
            console.error("Firebase Admin Init Error:", error);
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
