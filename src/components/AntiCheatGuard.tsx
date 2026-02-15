"use client";

import { useEffect, useState, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment } from "firebase/firestore";

interface AntiCheatContextType {
    setSafeMode: (active: boolean) => void;
}

const AntiCheatContext = createContext<AntiCheatContextType | null>(null);

export const useAntiCheat = () => {
    const context = useContext(AntiCheatContext);
    if (!context) throw new Error("useAntiCheat must be used within AntiCheatGuard");
    return context;
};

interface AntiCheatGuardProps {
    children: React.ReactNode;
    onDisqualify?: () => void;
    maxWarnings?: number;
    allowCopyPaste?: boolean;
}

export default function AntiCheatGuard({ children, onDisqualify, maxWarnings = 3, allowCopyPaste = false }: AntiCheatGuardProps) {
    const [warnings, setWarnings] = useState(0);
    const [isEliminated, setIsEliminated] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isBlurred, setIsBlurred] = useState(false);
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);
    const safeModeRef = useRef(false);
    const setSafeMode = (active: boolean) => {
        safeModeRef.current = active;
        console.log("Safe Mode set to:", active);
    };

    // Enter Full Screen Helper
    const enterFullScreen = async () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            try {
                await elem.requestFullscreen();
                // Experimental: Try to lock system keys (Chrome/Edge only)
                // @ts-ignore
                if (navigator.keyboard && navigator.keyboard.lock) {
                    // @ts-ignore
                    await navigator.keyboard.lock(["AltLeft", "AltRight", "Tab", "Escape"]);
                    console.log("Keyboard locked");
                }
            } catch (err) {
                console.log("Full Screen / Keyboard Lock Error:", err);
            }
        }
    };

    useEffect(() => {
        // 1. Prevent Copy/Paste/Right Click
        const handlePrevent = (e: Event) => e.preventDefault();

        // 2. Visibility Change (Tab Switching) & Blur (Alt+Tab)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (safeModeRef.current) return;
                incrementWarnings("Tab switching is prohibited!");
            }
        };

        const handleBlur = () => {
            if (safeModeRef.current) return;
            setIsBlurred(true); // Content hidden immediately
            // Only warn if it's not a momentary blur (like clicking an alert)
            // But strict mode usually warns on any blur.
            incrementWarnings("Focus lost! Do not switch windows.");
        };

        const handleFocus = () => {
            setIsBlurred(false);
        };

        // 3. Full Screen Change Detection
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
                if (!safeModeRef.current) {
                    incrementWarnings("Exiting Full Screen is prohibited!");
                }
            } else {
                setIsFullScreen(true);
            }
        };

        // 4. Keyboard Blocking (Screenshots, DevTools, Close)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))
            ) {
                e.preventDefault();
                alert("DevTools are disabled.");
                return;
            }

            // Block Print: Ctrl+P
            if (e.ctrlKey && e.key.toUpperCase() === "P") {
                e.preventDefault();
                alert("Printing is disabled.");
                return;
            }

            // Block Save: Ctrl+S
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
                e.preventDefault();
                alert("Saving is disabled.");
                return;
            }

            // Block Close: Ctrl+W (Best Effort)
            // Note: Most browsers usually reserve this, but we can try + use beforeunload
            if (e.ctrlKey && e.key.toUpperCase() === "W") {
                e.preventDefault();
                e.stopPropagation();
                // We can't alert here reliably, but preventing default might stop it in some contexts (like PWAs)
                return;
            }

            // Detect PrintScreen
            if (e.key === "PrintScreen") {
                e.preventDefault();
                // Clear clipboard if possible
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText("");
                }
                alert("Screenshots are prohibited!");
                incrementWarnings("Screenshot attempt detected.");
            }
        };

        // 5. Prevent Tab Close (beforeunload)
        // Shows "Leave site?" dialog. Custom message is often ignored by modern browsers.
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Are you sure you want to leave? This will end your session.";
            return "Are you sure you want to leave? This will end your session.";
        };

        // Attach Listeners
        if (!allowCopyPaste) {
            document.addEventListener("contextmenu", handlePrevent);
            document.addEventListener("copy", handlePrevent);
            document.addEventListener("paste", handlePrevent);
            document.addEventListener("cut", handlePrevent);
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("fullscreenchange", handleFullScreenChange);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Initial Full Screen Check
        if (document.fullscreenElement) setIsFullScreen(true);

        return () => {
            if (!allowCopyPaste) {
                document.removeEventListener("contextmenu", handlePrevent);
                document.removeEventListener("copy", handlePrevent);
                document.removeEventListener("paste", handlePrevent);
                document.removeEventListener("cut", handlePrevent);
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [allowCopyPaste]);

    const incrementWarnings = async (reason: string) => {
        let newCount = 0;
        setWarnings(prev => {
            newCount = prev + 1;
            return newCount;
        });

        // Sync to Firestore
        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                const userRef = doc(db, "users", myEmail);
                await setDoc(userRef, {
                    warnings: increment(1)
                }, { merge: true });
            } catch (e) {
                console.error("Failed to sync warning:", e);
            }
        }

        console.warn(`Warning: ${reason}`);

        if (newCount > maxWarnings) {
            handleElimination();
        }
    };

    const handleElimination = async () => {
        setIsEliminated(true);
        if (onDisqualify) onDisqualify();

        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                const userRef = doc(db, "users", myEmail);
                await setDoc(userRef, {
                    status: "Disqualified"
                }, { merge: true });
            } catch (e) {
                console.error("Failed to sync disqualification:", e);
            }
        }
    };

    if (isEliminated) {
        return (
            <div className="center-screen" style={{
                backgroundColor: "#000", position: "fixed", top: 0, left: 0,
                width: "100%", height: "100%", zIndex: 99999, color: "red", textAlign: "center"
            }}>
                <div className="nes-container is-rounded is-dark" style={{ borderColor: "red" }}>
                    <h1>ELIMINATED</h1>
                    <p>You have violated the anti-cheating protocols.</p>
                    <p>Too many violations detected.</p>
                    <button className="nes-btn is-error" onClick={() => router.push("/")}>Return to Lobby</button>
                </div>
            </div>
        );
    }

    if (!isFullScreen) {
        return (
            <div className="center-screen" style={{
                backgroundColor: "#000", position: "fixed", top: 0, left: 0,
                width: "100%", height: "100%", zIndex: 9999, color: "#fff", textAlign: "center",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
            }}>
                <div className="nes-container is-rounded is-dark">
                    <h2>Security Check</h2>
                    <p>Full Screen Mode is required to continue.</p>
                    <button className="nes-btn is-primary" onClick={enterFullScreen}>
                        ENTER FULL SCREEN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AntiCheatContext.Provider value={{ setSafeMode }}>
            {/* Warning Overlay */}
            {warnings > 0 && (
                <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
                    <span className="nes-badge is-icon">
                        <span className="is-warning"><i className="nes-icon warning"></i></span>
                        <span className="is-warning">WARNINGS: {warnings}/{maxWarnings}</span>
                    </span>
                </div>
            )}

            {/* Blur Veil */}
            {isBlurred && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.95)", zIndex: 9998,
                    display: "flex", justifyContent: "center", alignItems: "center", color: "#fff"
                }}>
                    <h1>NO PEEKING!</h1>
                </div>
            )}

            <div ref={contentRef} className="no-select" style={{ userSelect: "none", filter: isBlurred ? "blur(10px)" : "none" }}>
                {children}
            </div>
        </AntiCheatContext.Provider>
    );
}
