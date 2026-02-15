"use client";

import Link from "next/link";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import StarBackground from "@/components/StarBackground";

export default function UserDashboard() {
    return (
        <>
            <StarBackground />

            <div className="container dashboard-layout" style={{ position: "relative", zIndex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>

                {/* Header / Profile Section */}
                <div className="nes-container with-title is-centered is-dark" style={{ marginBottom: "3rem" }}>
                    <p className="title">Player Profile</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                        <p style={{ fontSize: "1.2rem" }}>Welcome, Player 1!</p>
                        <div style={{ width: "100%", maxWidth: "600px" }}>
                            <div style={{ marginBottom: "10px", textAlign: "left" }}>Overall Progress:</div>
                            <progress className="nes-progress is-pattern" value="10" max="100" style={{ height: "25px" }}></progress>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "2rem",
                    alignItems: "start"
                }}>
                    {/* Mission Status Column */}
                    <div className="nes-container with-title" style={{ backgroundColor: "#fff", color: "#000" }}>
                        <p className="title" style={{ color: "#000", backgroundColor: "#fff", padding: "0 10px", marginTop: "-1.8rem" }}>Mission Status</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div className="nes-container is-rounded" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#000", color: "#fff" }}>
                                <p style={{ margin: 0 }}>Round 1: Quiz</p>
                                <Link href="/round1">
                                    <button className="nes-btn is-primary">START</button>
                                </Link>
                            </div>

                            <div className="nes-container is-rounded" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#000", color: "#fff" }}>
                                <p style={{ margin: 0 }}>Round 2: DSA</p>
                                <Link href="/round2">
                                    <button className="nes-btn is-warning">ENTER</button>
                                </Link>
                            </div>

                            <div className="nes-container is-rounded" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#000", color: "#fff" }}>
                                <p style={{ margin: 0 }}>Round 3: Dev</p>
                                <Link href="/round3">
                                    <button className="nes-btn is-success">CODE</button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Team Squad Column */}
                    <div className="nes-container with-title is-dark">
                        <p className="title">Team Squad</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="nes-container is-rounded is-dark" style={{ border: "2px solid #555" }}>
                                <p style={{ marginBottom: "0.5rem", color: "#888" }}>Teammate Status</p>
                                <p style={{ margin: 0, color: "#00ff00" }}>Player 2 (Online)</p>
                            </div>
                            <div className="nes-container is-rounded is-dark" style={{ border: "2px solid #555" }}>
                                <p style={{ marginBottom: "0.5rem", color: "#888" }}>Team Score</p>
                                <p style={{ margin: 0, color: "#fbd000", fontSize: "1.2rem" }}>1500 XP</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AntiCheatGuard />
        </>
    );
}
