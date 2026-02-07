"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkAccess } from "@/lib/allowlist";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get("role") || "user";
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (checkAccess(email, role)) {
            // In a real app, successful Firebase auth would happen here.
            // For now, we simulate success and redirect.
            // We could set a cookie/localStorage here for persistence.
            if (role === "admin") router.push("/admin");
            else if (role === "evaluator") router.push("/evaluator");
            else router.push("/dashboard");
        } else {
            setError("Access Denied: Email not authorized for this role.");
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
