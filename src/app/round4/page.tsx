"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { useContest } from "@/context/ContestContext";
import StarBackground from "@/components/StarBackground";

export default function Round4Page() {
    const { currentTimeout, unlockNextRound } = useContest();
    const [figmaLink, setFigmaLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    // 🚫 Ban Check + Load Figma link on mount
    useEffect(() => {
        const init = async () => {
            const myEmail = localStorage.getItem("contest_user_email");
            if (!myEmail) { window.location.href = "/login"; return; }

            // Check ban status
            try {
                const userSnap = await getDoc(doc(db, "users", myEmail));
                if (userSnap.exists()) {
                    const s = userSnap.data().status;
                    if (s === "Kicked" || s === "Disqualified") {
                        localStorage.removeItem("contest_user_email");
                        localStorage.removeItem("contest_user_role");
                        alert("⛔ You have been disqualified from this contest.");
                        window.location.href = "/login";
                        return;
                    }
                    // Check if already completed
                    if (userSnap.data().completedRoundIds?.includes(4)) {
                        setSubmitted(true);
                    }
                }
            } catch (e) { console.error("Init error", e); }

            // Load Figma link from Firestore
            try {
                const snap = await getDoc(doc(db, "contest_data", "round4"));
                if (snap.exists() && snap.data().figmaLink) {
                    setFigmaLink(snap.data().figmaLink);
                }
            } catch (e) { console.error("Error loading figma link", e); }

            setIsLoading(false);
        };
        init();
    }, []);

    // Redirect on timeout
    useEffect(() => {
        if (currentTimeout <= 0) {
            alert("Time's up! Redirecting to dashboard...");
            router.push("/dashboard");
        }
    }, [currentTimeout, router]);

    const handleMarkSubmitted = async () => {
        setIsSubmitting(true);
        const myEmail = localStorage.getItem("contest_user_email");
        if (myEmail) {
            try {
                await setDoc(doc(db, "users", myEmail), {
                    completedRoundIds: arrayUnion(4)
                }, { merge: true });
                unlockNextRound();
                setSubmitted(true);
            } catch (e) {
                console.error("Error marking submission:", e);
                alert("Error. Try again.");
            }
        }
        setIsSubmitting(false);
    };

    return (
        <AntiCheatGuard allowCopyPaste={true}>
            <div style={{ position: "relative", minHeight: "100vh" }}>
                <StarBackground />

                {/* Header */}
                <div style={{
                    position: "sticky", top: 0, zIndex: 10,
                    background: "#000", borderBottom: "4px solid #F7D51D",
                    display: "flex", alignItems: "center", padding: "0 20px", height: "60px"
                }}>
                    <h2 style={{ color: "#fbd000", fontSize: "1rem", margin: 0 }}>ROUND 4: WEB DEVELOPMENT</h2>
                    <span style={{ color: currentTimeout < 300 ? "red" : "cyan", marginLeft: "20px", fontWeight: "bold" }}>
                        ⏱ {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, "0")}
                    </span>
                </div>

                {/* Main Content */}
                <div style={{ position: "relative", zIndex: 1, padding: "3rem 2rem", maxWidth: "800px", margin: "0 auto" }}>

                    {isLoading ? (
                        <p style={{ color: "#fff", textAlign: "center" }}>Loading...</p>
                    ) : submitted ? (
                        <div className="nes-container is-dark with-title" style={{ textAlign: "center" }}>
                            <p className="title">ROUND 4</p>
                            <p style={{ fontSize: "2rem", color: "#92cc41" }}>✅ SUBMITTED</p>
                            <p style={{ color: "#aaa" }}>Your round 4 has been marked as submitted. Wait for the evaluators to review your work.</p>
                            <button className="nes-btn is-primary" style={{ marginTop: "20px" }} onClick={() => router.push("/dashboard")}>
                                BACK TO DASHBOARD
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Instructions */}
                            <div className="nes-container is-dark with-title" style={{ marginBottom: "2rem" }}>
                                <p className="title">INSTRUCTIONS</p>
                                <ol style={{ color: "#fff", lineHeight: "2rem", paddingLeft: "20px" }}>
                                    <li>Open the Figma file below to see the design you need to build.</li>
                                    <li>Open <strong style={{ color: "#F7D51D" }}>VS Code</strong> and code the design using HTML, CSS, and JavaScript.</li>
                                    <li>When done, click <strong style={{ color: "#92cc41" }}>MARK AS SUBMITTED</strong> below to notify the evaluators.</li>
                                </ol>
                            </div>

                            {/* Figma Link */}
                            <div className="nes-container is-dark with-title" style={{ marginBottom: "2rem", textAlign: "center" }}>
                                <p className="title">DESIGN FILE</p>
                                {figmaLink ? (
                                    <>
                                        <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "0.85rem" }}>
                                            Click below to open the Figma design file in your browser.
                                        </p>
                                        <a
                                            href={figmaLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ textDecoration: "none" }}
                                        >
                                            <button className="nes-btn is-primary" style={{ fontSize: "1rem", padding: "15px 30px" }}>
                                                🎨 OPEN FIGMA FILE
                                            </button>
                                        </a>
                                        <p style={{ marginTop: "15px", fontSize: "0.7rem", color: "#555", wordBreak: "break-all" }}>
                                            {figmaLink}
                                        </p>
                                    </>
                                ) : (
                                    <div style={{ padding: "20px" }}>
                                        <p style={{ color: "orange" }}>⏳ The Figma design file has not been shared yet.</p>
                                        <p style={{ color: "#666", fontSize: "0.8rem" }}>Please wait for the admin to upload the link, then refresh this page.</p>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="nes-container is-dark with-title" style={{ textAlign: "center" }}>
                                <p className="title">SUBMISSION</p>
                                <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "0.85rem" }}>
                                    Once you have coded your solution in VS Code, click below to mark your round as done.
                                    <br />
                                    <span style={{ color: "orange", fontSize: "0.75rem" }}>
                                        ⚠ Only click when you are fully done — this cannot be undone.
                                    </span>
                                </p>
                                <button
                                    className={`nes-btn ${isSubmitting ? "is-disabled" : "is-success"}`}
                                    onClick={handleMarkSubmitted}
                                    disabled={isSubmitting}
                                    style={{ fontSize: "1rem", padding: "12px 30px" }}
                                >
                                    {isSubmitting ? "SAVING..." : "✅ MARK AS SUBMITTED"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AntiCheatGuard>
    );
}
