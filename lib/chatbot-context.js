import "server-only";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatCompetitionLine(item, index) {
  const parts = [
    `${index + 1}. ${item.name}`,
    `penyelenggara ${item.organizer}`,
    `deadline ${item.deadlineText || "TBA"}`,
    `status ${item.deadlineInfo.badge}`,
    `penyisihan ${item.prelimText || "TBA"}`
  ];

  if (item.registrationLink) parts.push("punya link registrasi");
  if (item.guidebookLink) parts.push("punya guidebook");

  return parts.join(", ");
}

export function getIrisKnowledgeBase() {
  return [
    "IRIS adalah akronim dari Innovative Research on Intelligent Systems.",
    "IRIS merupakan komunitas bergengsi dan diakui secara resmi di dalam fakultas.",
    "IRIS adalah wadah dinamis bagi individu yang memiliki ketertarikan mendalam pada Data Science dan Artificial Intelligence, dengan ekosistem kolaboratif yang inklusif, berorientasi ke masa depan, dan mendorong inovasi.",
    "IRIS berfokus pada pengembangan keahlian teknis, pembangunan portofolio, kolaborasi proyek inovatif, dan persiapan anggota untuk kompetisi tingkat tinggi serta kegiatan riset yang inovatif.",
    "Komunitas ini terbuka bagi individu dari berbagai latar belakang dan tingkat pengalaman, serta mempersatukan anggotanya melalui semangat pertumbuhan, eksplorasi, dan dampak berkelanjutan di bidang AI dan Data Science.",
    "IRIS Competition Center adalah website publik milik IRIS untuk merangkum lomba dari spreadsheet utama dalam satu katalog yang cepat dipindai.",
    "Fokus website ini adalah informasi lomba, deadline pendaftaran, tanggal penyisihan, link registrasi, guidebook, Instagram, dan poster.",
    "IRIS juga memiliki admin panel internal untuk menambah atau menghapus lomba, tetapi chatbot publik hanya membantu seputar IRIS, IRIS Competition Center, dan data lomba yang tampil."
  ].join(" ");
}

export function buildCompetitionContext(competitions) {
  const totalCount = competitions.length;
  const actionable = competitions.filter(
    (item) => item.deadlineInfo.status === "open" || item.deadlineInfo.status === "soon"
  );
  const nearest = actionable.slice(0, 10).map(formatCompetitionLine);

  const organizers = [...new Set(competitions.map((item) => cleanText(item.organizer)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "id"))
    .slice(0, 24);

  return [
    `Total lomba publik saat ini: ${totalCount}.`,
    `Lomba yang masih actionable: ${actionable.length}.`,
    `Penyelenggara yang tersedia: ${organizers.join(", ") || "belum ada"}.`,
    "Daftar lomba prioritas dan terbaru untuk referensi jawaban:",
    ...nearest
  ].join("\n");
}

export function isCompetitionChatAllowed(question = "") {
  const normalized = cleanText(question).toLowerCase();

  if (!normalized) return false;

  const scopeKeywords = [
    "lomba",
    "kompetisi",
    "competition",
    "deadline",
    "due",
    "daftar",
    "pendaftaran",
    "registrasi",
    "guidebook",
    "penyisihan",
    "organizer",
    "penyelenggara",
    "event",
    "poster",
    "instagram",
    "linktree",
    "iris",
    "organisasi",
    "komunitas",
    "ai",
    "artificial intelligence",
    "data science",
    "research",
    "intelligent systems",
    "fakultas",
    "anggota",
    "portofolio",
    "riset",
    "urgent",
    "dekat",
    "minggu ini",
    "buka",
    "tutup"
  ];

  return scopeKeywords.some((keyword) => normalized.includes(keyword));
}

export function getOutOfScopeReply() {
  return "Aku fokus bantu jawab seputar IRIS Competition Center dan data lomba yang tampil di website ini, seperti deadline, status pendaftaran, penyelenggara, guidebook, dan link terkait. Untuk topik di luar itu, aku belum bisa bantu.";
}
