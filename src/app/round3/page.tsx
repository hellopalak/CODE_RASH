"use client";

import { useState, useEffect } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useRouter } from "next/navigation";
import { useContest } from "@/context/ContestContext";

// Syllabus: AI, Cloud, Cybersec, CS Fundamentals, Hardware History
const TECH_QUIZ_QUESTIONS = [
    { id: 1, text: "Which AI model is developed by OpenAI?", options: ["Llama", "Gemini", "GPT-4", "Claude"], answer: 2 },
    { id: 2, text: "What does AWS stand for?", options: ["Amazon Web Services", "Apple Web System", "Advanced Web Solutions", "Automated Web Server"], answer: 0 },
    { id: 3, text: "Which protocol is use for secure browsing?", options: ["HTTP", "FTP", "SSH", "HTTPS"], answer: 3 },
    { id: 4, text: "The 'brain' of the computer is:", options: ["RAM", "GPU", "CPU", "Motherboard"], answer: 2 },
    { id: 5, text: "Who is considered the father of the computer?", options: ["Alan Turing", "Charles Babbage", "Steve Jobs", "Bill Gates"], answer: 1 },
    { id: 6, text: "Which is a NoSQL database?", options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], answer: 2 },
    { id: 7, text: "What is the primary function of an OS?", options: ["Compile code", "Manage resources", "Design websites", "Protect from viruses"], answer: 1 },
    { id: 8, text: "First computer programmer?", options: ["Ada Lovelace", "Grace Hopper", "Margaret Hamilton", "Katherine Johnson"], answer: 0 },
    { id: 9, text: "What year was the World Wide Web invented?", options: ["1983", "1989", "1995", "2000"], answer: 1 },
    { id: 10, text: "Which cloud provider belongs to Google?", options: ["Azure", "AWS", "DigitalOcean", "GCP"], answer: 3 },
];

export default function Round3Page() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const router = useRouter();
    const { currentTimeout, unlockNextRound } = useContest();

    const handleNextQuestion = (selectedOptionIndex: number | null) => {
        if (selectedOptionIndex === TECH_QUIZ_QUESTIONS[currentQuestion].answer) {
            setScore(s => s + 10);
        }

        if (currentQuestion < TECH_QUIZ_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            unlockNextRound();
        }
    };

    const question = TECH_QUIZ_QUESTIONS[currentQuestion];

    return (
        <AntiCheatGuard>
            <div className="container" style={{ marginTop: "50px" }}>
                <div className="nes-container is-rounded is-dark">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <span>Question {currentQuestion + 1}/{TECH_QUIZ_QUESTIONS.length}</span>
                        <span style={{ color: currentTimeout < 60 ? "red" : "cyan" }}>
                            Time: {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="nes-container with-title is-centered is-rounded" style={{ color: "#000", background: "#fff" }}>
                        <p className="title" style={{ color: "#000" }}>Tech Quiz</p>
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
