
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const adminAuth = getAdminAuth(); // This will throw if init fails, catching below
        const { users } = await request.json();

        if (!Array.isArray(users)) {
            return NextResponse.json({ error: "Invalid data format. Expected 'users' array." }, { status: 400 });
        }

        const results = [];

        for (const user of users) {
            const { email, password } = user;
            try {
                // Create user
                await adminAuth.createUser({
                    email,
                    password,
                });
                results.push({ email, status: 'created' });
            } catch (error: any) {
                // If user already exists, we might want to just update password or ignore
                if (error.code === 'auth/email-already-exists') {
                    // Optional: Update password? For now, just mark 'exists'
                    // await adminAuth.updateUser(uid, { password })
                    results.push({ email, status: 'exists', error: error.message });
                } else {
                    results.push({ email, status: 'failed', error: error.message });
                }
            }
        }

        return NextResponse.json({ message: "Process complete", results });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
