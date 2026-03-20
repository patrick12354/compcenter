"use client";

export default function CompetitionCard({ competition, saved, onToggleSaved, onOpen }) {
  return (
    <article className="competition-card" onClick={() => onOpen(competition)} role="button" tabIndex={0}>
      <div className="card-poster">
        {competition.posterLink ? (
          <img src={competition.posterLink} alt={competition.name} />
        ) : (
          <div className="card-poster-fallback">IRIS</div>
        )}

        <div className="card-overlay">
          <span className={`status-pill status-${competition.deadlineInfo.tone}`}>{competition.deadlineInfo.badge}</span>
          <button
            type="button"
            className={`save-button ${saved ? "saved" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSaved(competition.slug);
            }}
            aria-label={saved ? `Hapus ${competition.name} dari saved` : `Simpan ${competition.name}`}
          >
            {saved ? "Tersimpan" : "Simpan"}
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="card-head">
          <h3>{competition.name}</h3>
          <div className="mini-chip">{competition.organizer}</div>
        </div>

        <div className="card-meta">
          <div className="meta-row">
            <span className="meta-label">Deadline</span>
            <span className="meta-value">{competition.deadlineText || "TBA"}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Penyisihan</span>
            <span className="meta-value">{competition.prelimText || "Belum diisi"}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Guidebook</span>
            <span className="meta-value">{competition.guidebookLink ? "Tersedia" : "Belum tersedia"}</span>
          </div>
        </div>

        <div className="card-footer">
          <div className="card-tags">
            {competition.registrationLink ? <span>Registrasi</span> : null}
            {competition.guidebookLink ? <span>Guidebook</span> : null}
            {competition.instagramLink ? <span>Instagram</span> : null}
          </div>
          <span className="secondary-button">Buka detail</span>
        </div>
      </div>
    </article>
  );
}
