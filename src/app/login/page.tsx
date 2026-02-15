"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkAccess } from "@/lib/allowlist";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
            // 1. Authenticate with Firebase
            // const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // const user = userCredential.user;

            // For now, we are simulating the auth because we need the user to set up env vars first.
            // But I will leave the structure ready for when they do.

            // SIMULATION (Remove this when Env Vars are set)
            // if (password !== "password") throw new Error("Wrong password (for simulation use 'password')");

            // 2. Check Access Control (Role-based & Password)
            const allowed = await checkAccess(email, role, password);

            if (allowed) {
                if (role === "admin") router.push("/admin");
                else if (role === "evaluator") router.push("/evaluator");
                else {
                    localStorage.setItem("contest_user_email", email);
                    router.push("/dashboard");
                }
            } else {
                setError("Access Denied: Invalid email, password, or role.");
            }
        } catch (err: any) {
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
