const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Check for Service Account Key
const serviceAccountPath = path.join(__dirname, '../service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ ERROR: 'service-account.json' not found in project root.");
    console.error("👉 Please download it from: Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key");
    console.error("👉 Save it as 'service-account.json' in the main folder (code-rash/)");
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// 2. Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 3. Load Users from CSV
const csvFilePath = path.join(__dirname, '../users.csv');
let USERS_TO_ADD = [];

if (fs.existsSync(csvFilePath)) {
    console.log("📂 Found 'users.csv', reading users...");
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    // Split by new line, skip header if present
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

    lines.forEach((line, index) => {
        // Simple CSV parse: Email,Password (assuming no commas in password)
        const parts = line.split(',');
        if (parts.length >= 2) {
            const email = parts[0].trim();
            const password = parts[1].trim();

            // Skip header row if it looks like "Email,Password"
            if (email.toLowerCase() === 'email' && password.toLowerCase() === 'password') return;

            if (email && password) {
                USERS_TO_ADD.push({ email, password });
            }
        }
    });
} else {
    console.warn("⚠️ 'users.csv' not found. Creating a template file...");
    fs.writeFileSync(csvFilePath, "Email,Password\nstudent1@example.com,password123\n");
    console.log("👉 Edit 'users.csv' and run this script again.");
    process.exit(0);
}

async function addUsers() {
    console.log(`🚀 Starting bulk add for ${USERS_TO_ADD.length} users...`);
    let successCount = 0;
    let failCount = 0;

    for (const user of USERS_TO_ADD) {
        try {
            await admin.auth().createUser({
                email: user.email,
                password: user.password,
            });
            console.log(`✅ Created: ${user.email}`);
            successCount++;
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log(`⚠️ Skipped: ${user.email} (Already exists)`);
            } else {
                console.error(`❌ Failed: ${user.email}`, error.message);
            }
            failCount++;
        }
    }

    console.log(`\n🎉 DONE! Success: ${successCount}, Skipped/Failed: ${failCount}`);
    process.exit(0);
}

addUsers();
