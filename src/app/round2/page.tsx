"use client";

import { useState } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import SafeLink from "@/components/SafeLink";
import { useContest } from "@/context/ContestContext";

export default function Round2Page() {
    const { currentTimeout, unlockNextRound } = useContest();

    // In real app, these would be fetched from Firebase/Codeforces API
    const problems = [
        { id: "1", title: "Watermelon", difficulty: "800", link: "https://codeforces.com/problemset/problem/4/A" },
        { id: "2", title: "Way Too Long Words", difficulty: "800", link: "https://codeforces.com/problemset/problem/71/A" }
    ];

    // Sprint Logic: Total 30m (1800s). First 15m (1800-900) = Prob 1. Last 15m (900-0) = Prob 2.
    const isSprint1 = currentTimeout > 900;
    const currentProblem = isSprint1 ? problems[0] : problems[1];

    // Calculate sprint time remaining
    const sprintTime = isSprint1 ? currentTimeout - 900 : currentTimeout;

    return (
        <AntiCheatGuard>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded is-dark">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2>Round 2: DSA Sprints</h2>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ color: "cyan", display: "block" }}>
                                Total Time: {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                            </span>
                            <span style={{ color: "yellow", fontSize: "0.8rem" }}>
                                Sprint {isSprint1 ? "1" : "2"} Ends In: {Math.floor(sprintTime / 60)}:{(sprintTime % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    <p style={{ marginBottom: "20px" }}>
                        Solve the current sprint problem on Codeforces.
                        <br />
                        WARNING: Sprint {isSprint1 ? "1" : "2"} is active.
                    </p>

                    <div className="nes-table-responsive">
                        <table className="nes-table is-bordered is-centered is-dark" style={{ width: "100%" }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Problem Name</th>
                                    <th>Difficulty</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{isSprint1 ? "1" : "2"}</td>
                                    <td>{currentProblem.title}</td>
                                    <td>{currentProblem.difficulty}</td>
                                    <td>
                                        <SafeLink href={currentProblem.link} className="">
                                            <button className="nes-btn is-primary">SOLVE</button>
                                        </SafeLink>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
