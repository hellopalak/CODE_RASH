"use client";

import { useState } from "react";

export default function EvaluatorDashboard() {
    const [teams, setTeams] = useState([
        { id: 1, name: "Team Alpha", round: "Dev", status: "Submitted", score: 0 },
        { id: 2, name: "Team Beta", round: "DSA", status: "In Progress", score: 0 },
        { id: 3, name: "Team Gamma", round: "Quiz", status: "Complete", score: 85 },
    ]);

    const handleScoreChange = (id: number, val: number) => {
        setTeams(teams.map(t => t.id === id ? { ...t, score: val } : t));
    };

    const submitScore = (id: number) => {
        alert(`Score submitted for Team ${id}`);
        // Sync to DB
    };

    return (
        <div className="container">
            <div className="nes-container with-title is-primary">
                <p className="title">Evaluator Station</p>
                <p>Review participant submissions and assign scores.</p>
            </div>

            <div className="nes-table-responsive" style={{ marginTop: "20px" }}>
                <table className="nes-table is-bordered is-centered" style={{ width: "100%", color: "black", backgroundColor: "white" }}>
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>Round</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(team => (
                            <tr key={team.id}>
                                <td>{team.name}</td>
                                <td>{team.round}</td>
                                <td>{team.status}</td>
                                <td>
                                    <input
                                        type="number"
                                        className="nes-input is-success"
                                        style={{ width: "80px", padding: "4px" }}
                                        value={team.score}
                                        onChange={(e) => handleScoreChange(team.id, Number(e.target.value))}
                                    />
                                </td>
                                <td>
                                    <button
                                        className={`nes-btn is-small ${team.status === 'Submitted' || team.status === 'Complete' ? 'is-success' : 'is-disabled'}`}
                                        onClick={() => submitScore(team.id)}
                                        disabled={team.status === 'In Progress'}
                                    >
                                        Grade
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
