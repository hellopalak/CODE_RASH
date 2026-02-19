
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

try {
    console.log("Current Directory:", process.cwd());
    const filePath = path.join(process.cwd(), 'service-account.json');
    console.log("Reading file from:", filePath);

    if (!fs.existsSync(filePath)) {
        console.error("ERROR: File does not exist!");
        process.exit(1);
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const serviceAccount = JSON.parse(fileContents);

    console.log("Service Account Project ID:", serviceAccount.project_id);
    console.log("Service Account Client Email:", serviceAccount.client_email);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin Initialized Successfully!");
} catch (error) {
    console.error("CRITICAL FAILURE:", error);
}
