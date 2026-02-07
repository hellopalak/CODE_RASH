"use client";

import Link from "next/link";
import AntiCheatGuard from "@/components/AntiCheatGuard";

export default function UserDashboard() {
    return (
        <div className="container">
            <div className="nes-container with-title is-centered">
                <p className="title">Player Profile</p>
                <p>Welcome, Player 1!</p>
                <div style={{ marginBottom: "10px" }}>Overall Progress:</div>
                <progress className="nes-progress is-pattern" value="10" max="100"></progress>
            </div>

            <div style={{ marginTop: "2rem" }}>
                <h2>Mission Status</h2>

                <div className="nes-container is-rounded" style={{ marginTop: "1rem" }}>
                    <p>Round 1: Technical Quiz</p>
                    <Link href="/round1">
                        <button className="nes-btn is-primary">START</button>
                    </Link>
                </div>

                <div className="nes-container is-rounded" style={{ marginTop: "1rem" }}>
                    <p>Round 2: DSA</p>
                    <Link href="/round2">
                        <button className="nes-btn is-warning">ENTER</button>
                    </Link>
                </div>

                <div className="nes-container is-rounded" style={{ marginTop: "1rem" }}>
                    <p>Round 3: Development</p>
                    <Link href="/round3">
                        <button className="nes-btn is-success">CODE</button>
                    </Link>
                </div>
            </div>

            <div className="nes-container with-title is-dark" style={{ marginTop: "2rem" }}>
                <p className="title">Team Squad</p>
                <p>Teammate: Player 2 (Online)</p>
                <p>Team Score: 1500 XP</p>
            </div>
        </div>
    );
}
