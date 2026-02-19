"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import StarBackground from "@/components/StarBackground";
import { useContest } from "@/context/ContestContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function UserDashboard() {
    const { currentRoundId, currentTimeout } = useContest();
    const [userData, setUserData] = useState<any>(null);
    const [teamNameInput, setTeamNameInput] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Sync teamNameInput with userData when not editing
    useEffect(() => {
        // Only sync if strictly different to avoid loop
        if (!isEditing && userData && userData.teamName !== teamNameInput) {
            setTeamNameInput(userData.teamName || "");
        }
    }, [userData, isEditing]);



    // --- REAL FETCH IMPLEMENTATION ---
    useEffect(() => {
        const myEmail = localStorage.getItem("contest_user_email");
        if (!myEmail) {
            // Optional: Redirect to login if not found
            return;
        }

        // 1. Ensure User Exists in 'users' collection (for Admin Panel visibility)
        // We do this blindly to ensure "Online" status and existence
        try {
            setDoc(doc(db, "users", myEmail), {
                email: myEmail,
                status: "Online",
                lastActive: Date.now(),
                // Keep existing data if any, but ensure these fields
            }, { merge: true });
        } catch (e) {
            console.error("Error updating user status:", e);
        }

        const unsub = onSnapshot(doc(db, "users", myEmail), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                    name: data.name || myEmail.split("@")[0],
                    teamName: data.team || "",
                    score: (data.scores?.round1 || 0) + (data.scores?.round3 || 0), // Aggregate score
                    scores: data.scores || {}, // Store individual scores
                    completedRoundIds: data.completedRoundIds || []
                });
            } else {
                // If doesn't exist yet (snap might happen before setDoc finishes), init local
                setUserData({ name: myEmail.split("@")[0], score: 0 });
            }
        });

        return () => unsub();
    }, []);

    const handleTeamNameUpdate = async (newName: string) => {
        const email = localStorage.getItem("contest_user_email");
        if (!email) return;

        // Note: We rely on Firestore 'onSnapshot' to update the UI (latency compensation)
        // We DO NOT manually set userData here to avoid race conditions.

        try {
            await updateDoc(doc(db, "users", email), { team: newName });
        } catch (e) {
            console.error("Error updating team name:", e);
        }
    };
    const handleSaveTeamName = () => {
        handleTeamNameUpdate(teamNameInput.trim());
    };

    // Placeholder or fallback if needed, but we rely on real fetch now.
    // If we want to show loading state, we can add that later.

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <StarBackground />

            <div className="container dashboard-layout" style={{ position: "relative", zIndex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>

                {/* --- HEADER --- */}
                <div className="nes-container with-title is-centered is-dark" style={{ marginBottom: "3rem", position: "relative" }}>
                    <p className="title">PLAYER PROFILE</p>
                    <button
                        className="nes-btn is-error is-small"
                        style={{ position: "absolute", top: "-20px", right: "10px" }}
                        onClick={async () => {
                            if (confirm("Are you sure you want to logout?")) {
                                const myEmail = localStorage.getItem("contest_user_email");
                                if (myEmail) {
                                    try {
                                        await updateDoc(doc(db, "users", myEmail), { status: "Offline" });
                                    } catch (e) { console.error(e); }
                                }
                                localStorage.removeItem("contest_user_email");
                                await signOut(auth);
                                window.location.href = "/login";
                            }
                        }}
                    >
                        LOGOUT
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span>TEAM:</span>
                            {userData?.teamName ? (
                                <span className="nes-text is-success" style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                                    {userData.teamName}
                                </span>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        className="nes-input is-dark"
                                        style={{ width: "200px", height: "auto", padding: "5px", textAlign: "center" }}
                                        placeholder="ENTER NAME"
                                        value={teamNameInput}
                                        onChange={(e) => setTeamNameInput(e.target.value)}
                                    />
                                    <button
                                        className="nes-btn is-primary is-small"
                                        onClick={handleSaveTeamName}
                                        disabled={!teamNameInput.trim()}
                                    >
                                        SAVE
                                    </button>
                                </>
                            )}
                        </div>

                        {/* TIMER DISPLAY */}
                        <div className="nes-badge is-splited" style={{ margin: "10px 0" }}>
                            <span className="is-dark">TIME LEFT </span>
                            <span className={currentTimeout < 60 ? "is-error" : "is-warning"}>
                                {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                            </span>
                        </div>

                        <div style={{ width: "100%", maxWidth: "600px" }}>
                            <div style={{ marginBottom: "10px", textAlign: "left" }}>
                                ROUND {currentRoundId}/4 PROGRESS:
                            </div>
                            <progress className="nes-progress is-pattern" value={currentRoundId * 25} max="100" style={{ height: "25px" }}></progress>
                        </div>
                    </div>
                </div>

                {/* --- MAIN GRID --- */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "2rem",
                    alignItems: "start"
                }}>

                    {/* MISSION STATUS (Rounds) */}
                    <div className="nes-container with-title is-dark">
                        <p className="title">MISSION STATUS</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {/* Round 1 */}
                            <div className={`nes-container is-rounded ${currentRoundId >= 1 ? "is-dark" : "is-disabled"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: currentRoundId === 1 ? "#F7D51D" : "" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {currentRoundId < 1 && <span>🔒</span>}
                                    <p style={{ margin: 0 }}>ROUND 1: LOGICAL REASONING</p>
                                </div>
                                {userData?.completedRoundIds?.includes(1) ? (
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ color: "#92cc41", display: "block" }}>COMPLETED</span>
                                        <span style={{ fontSize: "0.8rem", color: "yellow" }}>SCORE: {userData?.scores?.round1 || 0}</span>
                                        {currentRoundId === 1 && <span style={{ display: "block", fontSize: "0.6rem", color: "#666" }}>WAITING FOR NEXT ROUND...</span>}
                                    </div>
                                ) : currentRoundId === 1 ? (
                                    <Link href="/round1"><button className="nes-btn is-primary">START</button></Link>
                                ) : currentRoundId > 1 ? (
                                    <span style={{ color: "#92cc41" }}>SKIPPED/DONE</span>
                                ) : <button className="nes-btn is-disabled">LOCKED</button>}
                            </div>

                            {/* Round 2 */}
                            <div className={`nes-container is-rounded ${currentRoundId >= 2 ? "is-dark" : "is-disabled"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: currentRoundId === 2 ? "#F7D51D" : "" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {currentRoundId < 2 && <span>🔒</span>}
                                    <p style={{ margin: 0 }}>ROUND 2: DSA</p>
                                </div>
                                {userData?.completedRoundIds?.includes(2) ? (
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ color: "#92cc41", display: "block" }}>SUBMITTED</span>
                                        {currentRoundId === 2 && <span style={{ display: "block", fontSize: "0.6rem", color: "#666" }}>WAITING FOR NEXT ROUND...</span>}
                                    </div>
                                ) : currentRoundId === 2 ? (
                                    <Link href="/round2"><button className="nes-btn is-warning">ENTER</button></Link>
                                ) : currentRoundId > 2 ? (
                                    <span style={{ color: "#92cc41" }}>COMPLETED</span>
                                ) : <button className="nes-btn is-disabled">LOCKED</button>}
                            </div>

                            {/* Round 3 */}
                            <div className={`nes-container is-rounded ${currentRoundId >= 3 ? "is-dark" : "is-disabled"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: currentRoundId === 3 ? "#F7D51D" : "" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {currentRoundId < 3 && <span>🔒</span>}
                                    <p style={{ margin: 0 }}>ROUND 3: TECH QUIZ</p>
                                </div>
                                {userData?.completedRoundIds?.includes(3) ? (
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ color: "#92cc41", display: "block" }}>COMPLETED</span>
                                        <span style={{ fontSize: "0.8rem", color: "yellow" }}>SCORE: {userData?.scores?.round3 || 0}</span>
                                        {currentRoundId === 3 && <span style={{ display: "block", fontSize: "0.6rem", color: "#666" }}>WAITING FOR NEXT ROUND...</span>}
                                    </div>
                                ) : currentRoundId === 3 ? (
                                    <Link href="/round3"><button className="nes-btn is-success">CODE</button></Link>
                                ) : currentRoundId > 3 ? (
                                    <span style={{ color: "#92cc41" }}>SKIPPED/DONE</span>
                                ) : <button className="nes-btn is-disabled">LOCKED</button>}
                            </div>

                            {/* Round 4 */}
                            <div className={`nes-container is-rounded ${currentRoundId >= 4 ? "is-dark" : "is-disabled"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: currentRoundId === 4 ? "#F7D51D" : "" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {currentRoundId < 4 && <span>🔒</span>}
                                    <p style={{ margin: 0 }}>ROUND 4: WEB DEVELOPEMENT</p>
                                </div>
                                {userData?.completedRoundIds?.includes(4) ? (
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ color: "#92cc41", display: "block" }}>SUBMITTED</span>
                                        {currentRoundId === 4 && <span style={{ display: "block", fontSize: "0.6rem", color: "#666" }}>WAITING FOR FINAL RESULTS...</span>}
                                    </div>
                                ) : currentRoundId === 4 ? (
                                    <Link href="/round4"><button className="nes-btn is-error">BUILD</button></Link>
                                ) : currentRoundId > 4 ? (
                                    <span style={{ color: "#92cc41" }}>COMPLETED</span>
                                ) : <button className="nes-btn is-disabled">LOCKED</button>}
                            </div>
                        </div>
                    </div>

                    {/* TEAM SQUAD */}
                    <div className="nes-container with-title is-dark">
                        <p className="title">TEAM SQUAD</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                            {/* Team Name */}
                            <div className="nes-container is-rounded is-dark" style={{ border: "2px solid #555" }}>
                                <p style={{ marginBottom: "0.5rem", color: "#888", fontSize: "0.8rem" }}>TEAM AFFILIATION</p>
                                <p style={{ margin: 0, color: "#00ff00", fontSize: "1.2rem" }}>
                                    {userData?.teamName ? `TEAM ${userData.teamName}` : "NO TEAM"}
                                </p>
                            </div>

                            {/* Score */}
                            <div className="nes-container is-rounded is-dark" style={{ border: "2px solid #555" }}>
                                <p style={{ marginBottom: "0.5rem", color: "#888", fontSize: "0.8rem" }}>TOTAL SCORE</p>
                                <p style={{ margin: 0, color: "#fbd000", fontSize: "2rem" }}>
                                    {userData?.score || 0} XP
                                </p>
                            </div>

                            {/* Status */}
                            <div className="nes-container is-rounded is-dark" style={{ border: "2px solid #555" }}>
                                <p style={{ marginBottom: "0.5rem", color: "#888", fontSize: "0.8rem" }}>STATUS</p>
                                <p style={{ margin: 0, color: "#92cc41" }}>● CONNECTED to SERVER</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AntiCheatGuard wraps nothing here because it's global or per-page? 
                Actually the user asked for it in dashboard? Usually logic is per round. 
                But if we want it here, we must wrap content. 
                If the component is designed to wrap children, we should wrap the whole div.
                However, usually Dashboard is SAFE zone. 
                I will remove it from here unless requested, OR wrap the whole thing if strict.
                Let's wrap the dashboard to prevent snooping?
            */}
        </div>
    );
}
