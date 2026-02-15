"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useContest } from "@/context/ContestContext";

// Mock Questions - In real app, fetch from Firebase
const MOCK_QUESTIONS = [
    { id: 1, text: "Which language runs in the browser?", options: ["Java", "C", "Python", "JavaScript"], answer: 3 },
    { id: 2, text: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], answer: 1 },
    // ... more questions
];

export default function Round1Page() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const { currentTimeout, unlockNextRound } = useContest();

    const handleNextQuestion = (selectedOptionIndex: number | null) => {
        // Check answer
        if (selectedOptionIndex === MOCK_QUESTIONS[currentQuestion].answer) {
            setScore(s => s + 10);
        }

        if (currentQuestion < MOCK_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            unlockNextRound();
        }
    };

    const handleDisqualify = () => {
        console.log("User Disqualified from Round 1");
    };

    const question = MOCK_QUESTIONS[currentQuestion];

    return (
        <AntiCheatGuard onDisqualify={handleDisqualify}>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <span>Question {currentQuestion + 1}/{MOCK_QUESTIONS.length}</span>
                        <span style={{ color: currentTimeout < 60 ? "red" : "inherit" }}>
                            Time: {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="nes-container with-title is-centered">
                        <p className="title">Technical Quiz</p>
                        <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>{question.text}</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            {question.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="nes-btn"
                                    onClick={() => handleNextQuestion(idx)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
