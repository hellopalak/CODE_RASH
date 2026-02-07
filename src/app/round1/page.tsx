"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";

// Mock Questions - In real app, fetch from Firebase
const MOCK_QUESTIONS = [
    { id: 1, text: "Which language runs in the browser?", options: ["Java", "C", "Python", "JavaScript"], answer: 3 },
    { id: 2, text: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], answer: 1 },
    // ... more questions
];

export default function Round1Page() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timer, setTimer] = useState(30);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (isFinished) return;
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    handleNextQuestion(null); // Timeout
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [currentQuestion, isFinished]);

    const handleNextQuestion = (selectedOptionIndex: number | null) => {
        // Check answer
        if (selectedOptionIndex === MOCK_QUESTIONS[currentQuestion].answer) {
            setScore(s => s + 10);
        }

        if (currentQuestion < MOCK_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setTimer(30);
        } else {
            setIsFinished(true);
        }
    };

    const handleDisqualify = () => {
        console.log("User Disqualified from Round 1");
    };

    if (isFinished) {
        return (
            <div className="container center-screen">
                <div className="nes-container is-rounded is-dark">
                    <h2>Round 1 Complete!</h2>
                    <p>Your Score: {score}</p>
                    <button className="nes-btn is-primary" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const question = MOCK_QUESTIONS[currentQuestion];

    return (
        <AntiCheatGuard onDisqualify={handleDisqualify}>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <span>Question {currentQuestion + 1}/{MOCK_QUESTIONS.length}</span>
                        <span style={{ color: timer < 10 ? "red" : "inherit" }}>Time: {timer}s</span>
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
