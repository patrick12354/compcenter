import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompetitionBySlug,
  getCompetitionInsights,
  getCompetitions
} from "@/lib/competition-data";
import { buildCalendarLink, formatDeadlineStatus, getShareCopy } from "@/lib/competition-helpers";

export const revalidate = 900;

export async function generateStaticParams() {
  const competitions = await getCompetitions();
  return competitions.map((competition) => ({
    slug: competition.slug
  }));
}

export async function generateMetadata({ params }) {
  const competition = await getCompetitionBySlug(params.slug);

  if (!competition) {
    return {
      title: "Lomba tidak ditemukan | IRIS Competition Center"
    };
  }

  return {
    title: `${competition.name} | IRIS Competition Center`,
    description: `${competition.organizer} • ${competition.deadlineText || "Deadline TBA"}`
  };
}

export default async function CompetitionDetailPage({ params }) {
  const competition = await getCompetitionBySlug(params.slug);

  if (!competition) {
    notFound();
  }

  const competitions = await getCompetitions();
  const insights = getCompetitionInsights(competitions);
  const deadlineBadge = formatDeadlineStatus(competition.deadlineInfo);

  return (
    <main className="page-shell detail-shell">
      <div className="background-grid" />
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <section className="detail-hero">
        <div className="detail-topbar">
          <Link href="/" className="ghost-link">
            Kembali ke radar
          </Link>
          <div className="mini-stats">
            <span>{insights.openCount} masih buka</span>
            <span>{insights.closingSoonCount} deadline dekat</span>
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-main-card">
            <div className="eyebrow-row">
              <span className={`status-pill status-${competition.deadlineInfo.tone}`}>
                {deadlineBadge}
              </span>
              {competition.guidebookLink ? <span className="subtle-pill">Guidebook tersedia</span> : null}
              {competition.registrationLink ? <span className="subtle-pill">Pendaftaran tersedia</span> : null}
            </div>

            <h1 className="detail-title">{competition.name}</h1>
            <p className="detail-subtitle">
              {competition.organizer} • {competition.prelimText || "Jadwal penyisihan belum tersedia"}
            </p>

            <div className="detail-grid">
              <div className="detail-panel">
                <span className="panel-label">Deadline Pendaftaran</span>
                <strong>{competition.deadlineText || "TBA"}</strong>
                <p>{competition.deadlineInfo.note}</p>
              </div>
              <div className="detail-panel">
                <span className="panel-label">Penyelenggara</span>
                <strong>{competition.organizer}</strong>
                <p>Informasi publik yang tampil di kartu dan halaman detail.</p>
              </div>
              <div className="detail-panel">
                <span className="panel-label">Aset Tersedia</span>
                <strong>{competition.availableLinks.join(" • ") || "Belum ada link"}</strong>
                <p>Guidebook, registrasi, Instagram, dan linktree otomatis terdeteksi.</p>
              </div>
            </div>

            <div className="action-row">
              {competition.registrationLink ? (
                <a href={competition.registrationLink} target="_blank" rel="noreferrer" className="primary-button">
                  Daftar / Buka Form
                </a>
              ) : null}
              {competition.guidebookLink ? (
                <a href={competition.guidebookLink} target="_blank" rel="noreferrer" className="secondary-button">
                  Guidebook
                </a>
              ) : null}
              {competition.instagramLink ? (
                <a href={competition.instagramLink} target="_blank" rel="noreferrer" className="secondary-button">
                  Instagram
                </a>
              ) : null}
              <a href={buildCalendarLink(competition)} target="_blank" rel="noreferrer" className="secondary-button">
                Tambah ke kalender
              </a>
            </div>
          </div>

          <div className="detail-side-card">
            {competition.posterLink ? (
              <img src={competition.posterLink} alt={competition.name} className="detail-poster" />
            ) : (
              <div className="detail-poster-fallback">IRIS</div>
            )}

            <div className="detail-side-content">
              <span className="panel-label">Teks share</span>
              <p className="share-copy">{getShareCopy(competition)}</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(getShareCopy(competition))}`}
                target="_blank"
                rel="noreferrer"
                className="secondary-button full-width"
              >
                Bagikan ke WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
