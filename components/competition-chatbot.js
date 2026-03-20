"use client";

import { useEffect, useRef, useState } from "react";

const QUICK_PROMPTS = [
  "Lomba apa yang deadline-nya paling dekat?",
  "Event mana yang masih buka minggu ini?",
  "IRIS Competition Center itu apa?"
];

export default function CompetitionChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Silakan ajukan pertanyaan seputar lomba yang tampil di website ini atau mengenai IRIS Competition Center. Untuk topik di luar cakupan tersebut, saya belum dapat membantu."
    }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isLoading]);

  async function sendMessage(rawMessage) {
    const message = rawMessage.trim();
    if (!message || isLoading) return;

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message
    };

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      const reply = String(data?.reply || "gatau").trim() || "gatau";

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Chat sementara gagal diproses."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className={`chatbot-shell ${isOpen ? "open" : ""}`}>
      {isOpen ? (
        <section className="chatbot-panel" aria-label="IRIS chatbot">
          <div className="chatbot-header">
            <div>
              <strong>IRIS Chat</strong>
              <p>Tanya seputar lomba dan IRIS Competition Center.</p>
            </div>
            <button type="button" className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Tutup chat">
              ×
            </button>
          </div>

          <div className="chatbot-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="chatbot-prompt" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message ${message.role}`}>
                <span>{message.content}</span>
              </div>
            ))}
            {isLoading ? (
              <div className="chatbot-message assistant">
                <span>Menjawab...</span>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Contoh: deadline paling dekat"
              aria-label="Pertanyaan chatbot"
            />
            <button type="submit" className="primary-button" disabled={isLoading}>
              Kirim
            </button>
          </form>
        </section>
      ) : null}

      <button type="button" className="chatbot-trigger" onClick={() => setIsOpen((current) => !current)}>
        <span className="chatbot-trigger-badge">AI</span>
        <span>Tanya IRIS</span>
      </button>
    </div>
  );
}
