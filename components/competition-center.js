"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCalendarLink, getShareCopy } from "@/lib/competition-helpers";
import CompetitionCard from "@/components/competition-card";
import CompetitionChatbot from "@/components/competition-chatbot";
import CursorEffects from "@/components/cursor-effects";

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "open", label: "Masih buka" },
  { id: "soon", label: "Deadline dekat" },
  { id: "saved", label: "Tersimpan" },
  { id: "guidebook", label: "Ada guidebook" }
];

const SORTS = [
  { id: "deadline", label: "Deadline terdekat" },
  { id: "name", label: "Nama A-Z" },
  { id: "organizer", label: "Penyelenggara A-Z" },
  { id: "status", label: "Prioritas status" }
];

export default function CompetitionCenter({ competitions, insights, fetchError = false }) {
  const [query, setQuery] = useState("");
  const [organizer, setOrganizer] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [activeFilter, setActiveFilter] = useState("all");
  const [savedSlugs, setSavedSlugs] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fromStorage = window.localStorage.getItem("iris:saved-competitions");
    if (fromStorage) {
      setSavedSlugs(JSON.parse(fromStorage));
    }
  }, []);

  useEffect(() => {
    if (!selectedCompetition) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedCompetition(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCompetition]);

  const organizers = useMemo(() => {
    return [...new Set(competitions.map((item) => item.organizer).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "id")
    );
  }, [competitions]);

  const spotlight = useMemo(() => {
    const urgent = competitions.filter((item) => item.deadlineInfo.status === "soon");
    if (urgent.length) return urgent.slice(0, 3);
    return competitions.filter((item) => item.deadlineInfo.isActionable).slice(0, 3);
  }, [competitions]);

  const spotlightDescription = useMemo(() => {
    if (!spotlight.length) {
      return "Belum ada lomba prioritas yang dapat ditampilkan saat ini.";
    }

    if (spotlight.length === 1) {
      return "Lomba dengan tenggat terdekat yang layak diprioritaskan saat ini.";
    }

    return `${spotlight.length} lomba dengan tenggat terdekat yang layak diprioritaskan saat ini.`;
  }, [spotlight]);

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = competitions.filter((item) => {
      const searchMatch =
        !normalizedQuery ||
        item.searchIndex.includes(normalizedQuery) ||
        item.organizer.toLowerCase().includes(normalizedQuery);

      const organizerMatch = organizer === "all" || item.organizer === organizer;
      const savedMatch = activeFilter !== "saved" || savedSlugs.includes(item.slug);

      const quickFilterMatch =
        activeFilter === "all" ||
        (activeFilter === "open" &&
          (item.deadlineInfo.status === "open" || item.deadlineInfo.status === "soon")) ||
        (activeFilter === "soon" && item.deadlineInfo.status === "soon") ||
        (activeFilter === "guidebook" && Boolean(item.guidebookLink)) ||
        activeFilter === "saved";

      return searchMatch && organizerMatch && savedMatch && quickFilterMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "id");
      if (sortBy === "organizer") return a.organizer.localeCompare(b.organizer, "id");
      if (sortBy === "status") return a.deadlineInfo.priority - b.deadlineInfo.priority;
      return a.deadlineInfo.sortValue - b.deadlineInfo.sortValue;
    });
  }, [activeFilter, competitions, organizer, query, savedSlugs, sortBy]);

  function handleToggleSaved(slug) {
    setSavedSlugs((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      window.localStorage.setItem("iris:saved-competitions", JSON.stringify(next));
      return next;
    });
  }

  async function handleShare(competition) {
    const shareText = getShareCopy(competition);

    try {
      await navigator.clipboard.writeText(shareText);
      setToastMessage("Info lomba berhasil disalin.");
      window.setTimeout(() => setToastMessage(""), 2500);
    } catch {
      setToastMessage("Gagal menyalin info lomba.");
      window.setTimeout(() => setToastMessage(""), 2500);
    }
  }

  return (
    <main className="page-shell home-shell">
      <CursorEffects />
      <div className="background-grid" />
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <div className="home-content">
        <section className="hero-panel">
          <div className="nav-row">
            <div className="brand-lockup">
              <img
                src="https://res.cloudinary.com/dg4jf2sag/image/upload/v1772438965/logo_iris_gftpz1.png"
                alt="IRIS"
                className="brand-logo"
              />
              <div className="brand-text">
                <strong>IRIS Competition Center</strong>
                <span>Direktori kompetisi untuk menemukan peluang yang relevan lebih cepat.</span>
              </div>
            </div>
            <div className="nav-actions">
              <a href="/admin/login" className="secondary-button nav-admin-link">
                Admin
              </a>
            </div>
          </div>

          <div className="hero-copy">
            <div>
              <h1 className="hero-title">
                Temukan kompetisi terbaik untuk <span>langkah berikutnya.</span>
              </h1>
              <p className="hero-description">
                IRIS Competition Center merangkum informasi lomba dalam satu tempat yang ringkas, mudah ditelusuri,
                dan cepat dipindai. Seluruh data publik tetap mengacu pada sheet utama agar informasi yang ditampilkan
                konsisten dan mudah diperbarui.
              </p>
            </div>

            <div className="hero-side">
              <div className="insight-card">
                <span className="panel-label">Prioritas minggu ini</span>
                <strong>{insights.closingSoonCount}</strong>
                <p>Lomba dengan tenggat dekat yang perlu segera ditinjau.</p>
              </div>
              <div className="insight-card">
                <span className="panel-label">Guidebook tersedia</span>
                <strong>{insights.guidebookCount}</strong>
                <p>Lomba yang sudah menyertakan guidebook atau dokumen pendukung.</p>
              </div>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <span className="panel-label">Masih buka</span>
              <strong>{insights.openCount}</strong>
              <p>Lomba dengan pendaftaran yang masih berlangsung.</p>
            </article>
            <article className="summary-card">
              <span className="panel-label">Deadline dekat</span>
              <strong>{insights.closingSoonCount}</strong>
              <p>Perlu segera diprioritaskan dalam waktu dekat.</p>
            </article>
            <article className="summary-card">
              <span className="panel-label">Total lomba</span>
              <strong>{insights.totalCount}</strong>
              <p>Jumlah lomba publik yang saat ini ditampilkan.</p>
            </article>
            <article className="summary-card">
              <span className="panel-label">Guidebook</span>
              <strong>{insights.guidebookCount}</strong>
              <p>Sudah dilengkapi panduan atau dokumen pendukung.</p>
            </article>
          </div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <div>
              <h2>Spotlight deadline</h2>
              <p>{spotlightDescription}</p>
            </div>
            <p className="panel-note">Diurutkan berdasarkan tenggat terdekat dan tingkat urgensi.</p>
          </div>

          <div className="spotlight-grid">
            {spotlight.map((competition) => (
              <article
                key={competition.slug}
                className="spotlight-card"
                onClick={() => setSelectedCompetition(competition)}
                role="button"
                tabIndex={0}
              >
                <span className={`status-pill status-${competition.deadlineInfo.tone}`}>
                  {competition.deadlineInfo.badge}
                </span>
                <h3 className="spotlight-title">{competition.name}</h3>
                <p className="hero-description spotlight-copy">{competition.organizer}</p>
                <div className="spotlight-meta">
                  <span>{competition.deadlineText || "TBA"}</span>
                  <span>{competition.prelimText || "Jadwal penyisihan belum diisi"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="control-panel">
            <div className="section-header">
              <div>
                <h2>Panel pencarian</h2>
                <p>Cari lomba, filter penyelenggara, urutkan prioritas, lalu simpan daftar pilihan di browser.</p>
              </div>
              <p className="control-note">Daftar tersimpan hanya berlaku di browser ini dan tidak mengubah spreadsheet.</p>
            </div>

            {fetchError ? (
              <div className="empty-state">
                <h3>Sumber data spreadsheet sedang tidak dapat diakses.</h3>
                <p>Data belum berhasil dimuat pada permintaan ini. Silakan coba refresh beberapa saat lagi.</p>
              </div>
            ) : null}

            <div className="control-grid">
              <div className="field">
                <label htmlFor="query">Cari lomba</label>
                <input
                  id="query"
                  type="text"
                  placeholder="Contoh: data, statistik, business case"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="organizer">Penyelenggara</label>
                <select id="organizer" value={organizer} onChange={(event) => setOrganizer(event.target.value)}>
                  <option value="all">Semua penyelenggara</option>
                  {organizers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sort">Urutkan</label>
                <select id="sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  {SORTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tersimpan</label>
                <div className="hero-badge">{savedSlugs.length} lomba tersimpan</div>
              </div>
            </div>

            <div className="toggle-row">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`toggle-button ${activeFilter === item.id ? "active" : ""}`}
                  onClick={() => setActiveFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="catalog-panel">
            <div className="catalog-header">
              <div>
                <h2 className="catalog-title">Katalog kompetisi</h2>
                <p className="catalog-subtitle">
                  Klik kartu untuk melihat detail lomba dan membuka tautan penting seperti registrasi, guidebook,
                  kalender, dan kanal resmi penyelenggara.
                </p>
              </div>
              <div className="mini-stats">
                <span>{filteredCompetitions.length} hasil</span>
                <span>{competitions.length} total lomba</span>
              </div>
            </div>

            {filteredCompetitions.length ? (
              <div className="catalog-grid">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.slug}
                    competition={competition}
                    saved={savedSlugs.includes(competition.slug)}
                    onToggleSaved={handleToggleSaved}
                    onOpen={setSelectedCompetition}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Tidak ada hasil untuk kombinasi filter ini.</h3>
                <p>Coba ganti penyelenggara, ubah filter, atau gunakan kata kunci yang lebih umum.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedCompetition ? (
        <div className="modal-overlay" onClick={() => setSelectedCompetition(null)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedCompetition(null)}
              aria-label="Tutup detail lomba"
            >
              ×
            </button>

            <div className="modal-left">
              {selectedCompetition.posterLink ? (
                <img src={selectedCompetition.posterLink} alt={selectedCompetition.name} className="modal-poster" />
              ) : (
                <div className="detail-poster-fallback">IRIS</div>
              )}
            </div>

            <div className="modal-right">
              <h2 className="modal-title">{selectedCompetition.name}</h2>
              <div className="modal-organizer">{selectedCompetition.organizer}</div>

              <div className="modal-info-card">
                <span className="panel-label">Deadline pendaftaran</span>
                <strong>{selectedCompetition.deadlineText || "TBA"}</strong>
              </div>
              <div className="modal-info-card">
                <span className="panel-label">Tanggal penyisihan</span>
                <strong>{selectedCompetition.prelimText || "Belum diisi"}</strong>
              </div>

              <div className="modal-action-grid">
                {selectedCompetition.registrationLink ? (
                  <a
                    href={selectedCompetition.registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-button modal-primary"
                  >
                    Buka registrasi
                  </a>
                ) : null}
                {selectedCompetition.guidebookLink ? (
                  <a
                    href={selectedCompetition.guidebookLink}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-button"
                  >
                    Guidebook
                  </a>
                ) : null}
                <a
                  href={buildCalendarLink(selectedCompetition)}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-button"
                >
                  Ke kalender
                </a>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleShare(selectedCompetition)}
                >
                  Bagikan
                </button>
                {selectedCompetition.instagramLink ? (
                  <a
                    href={selectedCompetition.instagramLink}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-button"
                  >
                    Instagram
                  </a>
                ) : null}
                {selectedCompetition.linktree ? (
                  <a
                    href={selectedCompetition.linktree}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-button"
                  >
                    Linktree
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CompetitionChatbot />
      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
    </main>
  );
}
