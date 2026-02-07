"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AntiCheatGuardProps {
    children: React.ReactNode;
    onDisqualify?: () => void;
    contestId?: string;
    maxWarnings?: number;
}

export default function AntiCheatGuard({ children, onDisqualify, maxWarnings = 3 }: AntiCheatGuardProps) {
    const [warnings, setWarnings] = useState(0);
    const [isEliminated, setIsEliminated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // 1. Prevent Copy/Paste/Right Click
        const handlePrevent = (e: Event) => {
            e.preventDefault();
            // Optional: Add warning? Usually just blocking is enough for actions.
            // But user asked "if user changes tabs... elimininated".
            // "no chance of screenshot, no copy paste".
        };

        // 2. Tab Switching (Visibility Change)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings((prev) => {
                    const newCount = prev + 1;
                    if (newCount > maxWarnings) {
                        handleElimination();
                    }
                    return newCount;
                });
            }
        };

        // 3. Prevent Screenshots (Best effort: monitoring PrintScreen key, blur)
        // Note: OS level screenshots cannot be fully blocked by JS.
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p")) {
                e.preventDefault();
                alert("Screenshots are prohibited!");
                // Increment warning?
                setWarnings(prev => prev + 1);
            }
        };

        document.addEventListener("contextmenu", handlePrevent);
        document.addEventListener("copy", handlePrevent);
        document.addEventListener("paste", handlePrevent);
        document.addEventListener("cut", handlePrevent);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handlePrevent);
            document.removeEventListener("copy", handlePrevent);
            document.removeEventListener("paste", handlePrevent);
            document.removeEventListener("cut", handlePrevent);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [maxWarnings]);

    const handleElimination = () => {
        setIsEliminated(true);
        if (onDisqualify) onDisqualify();
        // Here we would sync with Firebase to mark user as Disqualified
    };

    if (isEliminated) {
        return (
            <div className="center-screen" style={{ backgroundColor: "#000", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999 }}>
                <div className="nes-container is-rounded is-dark" style={{ borderColor: "red", color: "red" }}>
                    <h1>ELIMINATED</h1>
                    <p>You have violated the anti-cheating protocols.</p>
                    <p>Tab switches detected: {warnings}</p>
                    <button className="nes-btn is-error" onClick={() => router.push("/")}>Return to Lobby</button>
                </div>
            </div>
        );
    }

    return (
        <>
            {warnings > 0 && (
                <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
                    <span className="nes-badge is-icon">
                        <span className="is-warning"><i className="nes-icon warning"></i></span>
                        <span className="is-warning">WARNINGS: {warnings}/{maxWarnings}</span>
                    </span>
                </div>
            )}
            <div className="no-select" style={{ userSelect: "none" }}>
                {children}
            </div>
        </>
    );
}
