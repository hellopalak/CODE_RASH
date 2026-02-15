"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import StarBackground from "@/components/StarBackground";
import { useContest } from "@/context/ContestContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";

export default function UserDashboard() {
    const { currentRoundId, currentTimeout } = useContest();
    const [userData, setUserData] = useState<any>(null);

    // Fetch User Data (Simulated ID/Email match)
    useEffect(() => {
        const fetchUserData = async () => {
            // TODO: In a real app, get this from Auth Context
            // For now, we listen to the "first user" found or a specific test user
            // Or simpler: We just query by the email stored in localStorage if we had it.
            // Let's assume user is "user1@example.com" for demo or just grab the first one.
            try {
                // Determine ONE email to show. In production this is `auth.currentUser.email`
                const emailToFetch = localStorage.getItem("user_email_cache") || "user1@example.com";

                // If we don't have a users collection populated with profiles yet, this might be empty.
                // We should check 'users' collection which Admin populates via presence/login?
                // Actually, 'allowed_users' has role/pass. 'users' has live status.
                // Let's TRY to find a document in 'users' that matches? Or just 'allowed_users'?
                // The user requested "Team Name" from email.
                // Let's assume we have a 'profiles' or we just read 'allowed_users' if it has extra data.
                // BUT for now, let's just try to read 'allowed_users' for static data (Team) + 'users' for score.

                // 1. Get Static Profile
                // ... implementation below
            } catch (e) {
                console.error("Error fetching dashboard data", e);
            }
        };
        fetchUserData();
    }, []);

    // --- REAL FETCH IMPLEMENTATION ---
    useEffect(() => {
        const myEmail = localStorage.getItem("contest_user_email");
        if (!myEmail) {
            // Optional: Redirect to login if not found
            return;
        }

        const unsub = onSnapshot(doc(db, "users", myEmail), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                    name: data.name || myEmail.split("@")[0],
                    teamName: data.team || "Unknown",
                    score: (data.scores?.round1 || 0) + (data.scores?.round3 || 0), // Aggregate score
                    scores: data.scores || {}, // Store individual scores
                    completedRoundIds: data.completedRoundIds || []
                });
            }
        });

        return () => unsub();
    }, []);
    // Placeholder or fallback if needed, but we rely on real fetch now.
    // If we want to show loading state, we can add that later.

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <StarBackground />

            <div className="container dashboard-layout" style={{ position: "relative", zIndex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>

                {/* --- HEADER --- */}
                <div className="nes-container with-title is-centered is-dark" style={{ marginBottom: "3rem" }}>
                    <p className="title">PLAYER PROFILE</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                        <p style={{ fontSize: "1.2rem" }}>WELCOME, {userData?.name ? userData.name.toUpperCase() : "PLAYER"}!</p>

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
                                    <p style={{ margin: 0 }}>ROUND 1: QUIZ</p>
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
                                    <p style={{ margin: 0 }}>ROUND 3: TECH</p>
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
                                    <p style={{ margin: 0 }}>ROUND 4: WEB</p>
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
