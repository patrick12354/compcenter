"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminCompetitionList({ competitions }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingRow, setDeletingRow] = useState(null);

  async function handleDelete(rowIndex, name, posterLink) {
    const cloudinaryNote = posterLink?.includes("res.cloudinary.com")
      ? "\nPoster Cloudinary yang terhubung juga akan dihapus."
      : "";
    const confirmed = window.confirm(
      `Hapus row untuk "${name}" dari spreadsheet?${cloudinaryNote}`
    );
    if (!confirmed) return;

    setDeletingRow(rowIndex);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/competitions/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rowIndex, posterLink })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus row.");
      }

      setFeedback(`"${name}" berhasil dihapus dari spreadsheet.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Gagal menghapus row.");
    } finally {
      setDeletingRow(null);
    }
  }

  return (
    <section className="admin-list-section">
      <div className="section-header">
        <div>
          <h2>Data di sheet utama</h2>
          <p>Daftar ini membaca row publik yang sekarang aktif di spreadsheet. Hapus akan menghapus row asli di sheet.</p>
        </div>
      </div>

      {feedback ? <div className={feedback.includes("berhasil") ? "form-success" : "form-error"}>{feedback}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Penyelenggara</th>
              <th>Deadline</th>
              <th>Poster</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((competition) => (
              <tr key={competition.rowIndex}>
                <td>{competition.no}</td>
                <td>{competition.name}</td>
                <td>{competition.organizer || "-"}</td>
                <td>{competition.registrationDeadline || "TBA"}</td>
                <td>
                  {competition.posterLink ? (
                    <a href={competition.posterLink} target="_blank" rel="noreferrer" className="table-link">
                      Lihat poster
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(competition.rowIndex, competition.name, competition.posterLink)}
                    disabled={isPending || deletingRow === competition.rowIndex}
                  >
                    {deletingRow === competition.rowIndex ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
