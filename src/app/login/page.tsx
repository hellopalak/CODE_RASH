"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkAccess } from "@/lib/allowlist";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get("role") || "user";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        try {

            // REVERTED TO: Custom Database Login (Insecure but requested)
            // 1. Check if user exists in 'allowed_users' and password matches
            const userDocRef = doc(db, "allowed_users", email);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                throw new Error("User not found.");
            }

            const userData = userDocSnap.data();
            if (userData.password !== password) {
                throw new Error("Invalid password.");
            }

            // 2. "Fake" Sign In (Since we aren't using Firebase Auth for credentials anymore)
            // We need a way to maintain session. 
            // The previous "Public Rules" method likely relied on localStorage or similar, OR 
            // we sign in ANONYMOUSLY to get a UID, but treat them as this email.
            // Let's use localStorage for simplicity as requested "just like before".
            localStorage.setItem("contest_user_email", email);
            localStorage.setItem("contest_user_role", role);

            // NOTE: Since we aren't using Firebase Auth 'signInWithEmailAndPassword',
            // 'auth.currentUser' will be null unless we do 'signInAnonymously'.
            // To make RLS work with 'if true' rules, this is fine.

            // 3. Check for Ban/Kick Status
            if (role === "user") {
                const userRef = doc(db, "users", email);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.status === "Kicked" || data.status === "Disqualified") {
                        setError("ACCOUNT BANNED: You have been kicked/disqualified from this contest.");
                        return;
                    }
                }
            }

            if (role === "admin") router.push("/admin");
            else if (role === "evaluator") router.push("/evaluator");
            else {
                localStorage.setItem("contest_user_email", email);
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Login Check Error:", err);
            setError(err.message || "Failed to login.");
        }
    };

    return (
        <div className="nes-container is-rounded" style={{ backgroundColor: "#000", maxWidth: "500px", width: "100%" }}>
            <h2 style={{ color: "#fbd000", textAlign: "center", marginBottom: "20px" }}>
                {role.toUpperCase()} LOGIN
            </h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px", color: "#fff" }}>Email Address:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="nes-input"
                        style={{
                            width: "100%",
                            padding: "10px",
                            fontFamily: "inherit",
                            backgroundColor: "#222",
                            color: "#fff",
                            border: "4px solid #fff"
                        }}
                        placeholder="enter@email.com"
                        required
                    />
                </div>

                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px", color: "#fff" }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="nes-input"
                        style={{
                            width: "100%",
                            padding: "10px",
                            fontFamily: "inherit",
                            backgroundColor: "#222",
                            color: "#fff",
                            border: "4px solid #fff"
                        }}
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p style={{ color: "red", fontSize: "0.8rem" }}>{error}</p>}

                <button type="submit" className="nes-btn is-primary" style={{ width: "100%" }}>
                    START GAME
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="center-screen">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
