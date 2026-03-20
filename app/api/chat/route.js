import { NextResponse } from "next/server";
import {
  buildCompetitionContext,
  getIrisKnowledgeBase,
  getOutOfScopeReply,
  isCompetitionChatAllowed
} from "@/lib/chatbot-context";
import { getCompetitions } from "@/lib/competition-data";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function getModelName() {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

function getGroqApiKey() {
  return process.env.GROQ_API_KEY || "";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const question = String(body?.message || "").trim();

    if (!question) {
      return NextResponse.json({ reply: "Tulis pertanyaan dulu." }, { status: 400 });
    }

    if (!isCompetitionChatAllowed(question)) {
      return NextResponse.json({ reply: getOutOfScopeReply() });
    }

    const apiKey = getGroqApiKey();
    if (!apiKey) {
      return NextResponse.json({ reply: "Fitur chat belum aktif." }, { status: 503 });
    }

    const competitions = await getCompetitions();
    const irisContext = getIrisKnowledgeBase();
    const competitionContext = buildCompetitionContext(competitions);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getModelName(),
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content: [
              "Kamu adalah asisten chat untuk IRIS Competition Center.",
              "Jawab hanya berdasarkan konteks IRIS Competition Center dan data lomba yang disediakan.",
              "Topik valid: IRIS Competition Center, lomba yang tampil, deadline, guidebook, penyelenggara, registrasi, penyisihan, poster, dan link terkait.",
              `Jika pertanyaan berada di luar topik itu, jawab persis: ${getOutOfScopeReply()}`,
              `Jangan mengarang data. Jika informasi tidak tersedia di konteks, jawab persis: ${getOutOfScopeReply()}`,
              "Gunakan bahasa Indonesia yang singkat, jelas, dan langsung ke inti."
            ].join(" ")
          },
          {
            role: "system",
            content: `Tentang IRIS:\n${irisContext}\n\nKonteks lomba:\n${competitionContext}`
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ reply: "Chat sementara gagal diproses.", detail: errorText }, { status: 502 });
    }

    const result = await response.json();
    const reply = String(result?.choices?.[0]?.message?.content || "").trim() || "gatau";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Chat sementara gagal diproses." }, { status: 500 });
  }
}
