"use client";

import { useState } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";

export default function Round2Page() {
    const [timer, setTimer] = useState(1800); // 30 mins total

    // In real app, these would be fetched from Firebase/Codeforces API
    const problems = [
        { id: "1", title: "Watermelon", difficulty: "800", link: "https://codeforces.com/problemset/problem/4/A" },
        { id: "2", title: "Way Too Long Words", difficulty: "800", link: "https://codeforces.com/problemset/problem/71/A" }
    ];

    return (
        <AntiCheatGuard>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded is-dark">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h2>Round 2: Data Structures & Algorithms</h2>
                        <span style={{ color: "cyan" }}>Time Remaining: {Math.floor(timer / 60)}m {timer % 60}s</span>
                    </div>

                    <p style={{ marginBottom: "20px" }}>
                        Solve the following problems on Codeforces.
                        <br />
                        WARNING: Leaving this tab may trigger anti-cheat warnings, but you must navigate to the problem.
                        (Ideally, open in a new constrained window or use the built-in browser if available).
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
                                {problems.map((prob, idx) => (
                                    <tr key={prob.id}>
                                        <td>{idx + 1}</td>
                                        <td>{prob.title}</td>
                                        <td>{prob.difficulty}</td>
                                        <td>
                                            <a href={prob.link} target="_blank" rel="noopener noreferrer">
                                                <button className="nes-btn is-primary">SOLVE</button>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
