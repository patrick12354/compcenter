import "server-only";
import Papa from "papaparse";
import { unstable_cache } from "next/cache";
import { getSheetRows, hasGoogleSheetsConfig } from "@/lib/admin-services";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ81H67Eq_L447mxzEO4fmfoyuzy4sqR6cnglIeQ7Jm6sWkElooSvHNlbroZRnNWzePl-iGCTFr1ymH/pub?gid=0&single=true&output=csv";

const MONTHS = {
  jan: 0,
  januari: 0,
  feb: 1,
  febuari: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  agu: 7,
  agustus: 7,
  agt: 7,
  sep: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11
};

function cleanValue(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return cleanValue(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDate(day, monthKey, year, fallbackYear) {
  const month = MONTHS[monthKey];
  if (month === undefined) return null;

  const parsedYear = year ? Number(year) : fallbackYear;
  return new Date(parsedYear, month, Number(day), 23, 59, 59);
}

function getDateMatches(raw) {
  const normalized = cleanValue(raw)
    .toLowerCase()
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\./g, " ");

  return [...normalized.matchAll(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/g)];
}

function buildDeadlineInfo(rawDeadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const value = cleanValue(rawDeadline);
  if (!value || value.toLowerCase().includes("tba")) {
    return {
      status: "tba",
      tone: "tba",
      badge: "Deadline TBA",
      note: "Tanggal belum dipublikasikan di spreadsheet sumber.",
      daysLeft: null,
      sortValue: 999999,
      priority: 4,
      isActionable: false
    };
  }

  const matches = getDateMatches(value);
  const fallbackYear = today.getFullYear();
  const last = matches.at(-1);
  const deadlineDate = last ? createDate(last[1], last[2], last[3], fallbackYear) : null;

  if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) {
    return {
      status: "tba",
      tone: "tba",
      badge: "Format belum terbaca",
      note: "Tanggal perlu dirapikan agar parser dapat membaca deadline.",
      daysLeft: null,
      sortValue: 999998,
      priority: 5,
      isActionable: false
    };
  }

  const difference = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);

  if (difference < 0) {
    return {
      status: "closed",
      tone: "closed",
      badge: "Sudah ditutup",
      note: `${Math.abs(difference)} hari sejak deadline terakhir.`,
      daysLeft: difference,
      sortValue: 100000 + Math.abs(difference),
      priority: 3,
      isActionable: false
    };
  }

  if (difference <= 7) {
    return {
      status: "soon",
      tone: "soon",
      badge: difference === 0 ? "Deadline hari ini" : `H-${difference}`,
      note: "Masuk radar prioritas tinggi minggu ini.",
      daysLeft: difference,
      sortValue: difference,
      priority: 1,
      isActionable: true
    };
  }

  return {
    status: "open",
    tone: "open",
    badge: `${difference} hari lagi`,
    note: "Masih terbuka, tapi belum masuk fase urgent.",
    daysLeft: difference,
    sortValue: difference,
    priority: 2,
    isActionable: true
  };
}

function parseCsv(csvText) {
  return Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  }).data;
}

const getCachedGoogleSheetRows = unstable_cache(
  async () => {
    const rows = await getSheetRows();
    return rows.map((row) => ({
      No: row[0] || "",
      Nama: row[1] || "",
      Penyelenggara: row[2] || "",
      "Tanggal Pendaftaran (close)": row[3] || "",
      "Tanggal Penyisihan": row[4] || "",
      "Link ig": row[5] || "",
      Linktree: row[6] || "",
      "Link Guidebook": row[7] || "",
      "Link Regis": row[8] || "",
      "Yang Daftar & Leader": row[9] || "",
      "Sudah Daftar": row[10] || "",
      "Sudah Menang": row[11] || "",
      "Link Poster": row[12] || ""
    }));
  },
  ["competitions-sheet-rows"],
  {
    revalidate: 900,
    tags: ["competitions"]
  }
);

function buildAvailableLinks(item) {
  return [
    item.guidebookLink ? "Guidebook" : null,
    item.registrationLink ? "Registrasi" : null,
    item.instagramLink ? "Instagram" : null,
    item.linktree ? "Linktree" : null
  ].filter(Boolean);
}

function normalizeCompetition(row, index) {
  const name = cleanValue(row["Nama"]);
  const organizer = cleanValue(row["Penyelenggara"]) || "TBA";
  const slugBase = slugify(name || `event-${index + 1}`);
  const deadlineText = cleanValue(row["Tanggal Pendaftaran (close)"]);
  const prelimText = cleanValue(row["Tanggal Penyisihan"]);
  const deadlineInfo = buildDeadlineInfo(deadlineText);

  const competition = {
    id: cleanValue(row["No"]) || String(index + 1),
    slug: `${slugBase}-${index + 1}`,
    name,
    organizer,
    deadlineText,
    prelimText,
    instagramLink: cleanValue(row["Link ig"]),
    linktree: cleanValue(row["Linktree"]),
    guidebookLink: cleanValue(row["Link Guidebook"]),
    registrationLink: cleanValue(row["Link Regis"]),
    posterLink: cleanValue(row["Link Poster"]),
    deadlineInfo
  };

  return {
    ...competition,
    availableLinks: buildAvailableLinks(competition),
    searchIndex: [competition.name, competition.organizer].join(" ").toLowerCase()
  };
}

export async function getCompetitions() {
  let rows;

  if (hasGoogleSheetsConfig()) {
    rows = await getCachedGoogleSheetRows();
  } else {
    const response = await fetch(SHEET_URL, {
      next: { revalidate: 900, tags: ["competitions"] }
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil spreadsheet sumber.");
    }

    const csv = await response.text();
    rows = parseCsv(csv);
  }

  return rows
    .filter((row) => cleanValue(row["Nama"]))
    .map(normalizeCompetition)
    .sort((a, b) => a.deadlineInfo.sortValue - b.deadlineInfo.sortValue);
}

export async function getCompetitionBySlug(slug) {
  const competitions = await getCompetitions();
  return competitions.find((item) => item.slug === slug) || null;
}

export function getCompetitionInsights(competitions) {
  return {
    openCount: competitions.filter(
      (item) => item.deadlineInfo.status === "open" || item.deadlineInfo.status === "soon"
    ).length,
    closingSoonCount: competitions.filter((item) => item.deadlineInfo.status === "soon").length,
    totalCount: competitions.length,
    guidebookCount: competitions.filter((item) => item.guidebookLink).length
  };
}
