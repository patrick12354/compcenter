"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_STATE = {
  name: "",
  organizer: "",
  registrationStart: "",
  registrationEnd: "",
  preliminaryStart: "",
  preliminaryEnd: "",
  instagramLink: "",
  linktree: "",
  guidebookLink: "",
  registrationLink: "",
  posterLink: ""
};

const INDONESIAN_MONTH_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function formatDateForSheet(value) {
  if (!value) return "";

  const parsedDate = new Date(`${value}T00:00:00`);
  return INDONESIAN_MONTH_FORMATTER.format(parsedDate);
}

function buildRangeText(startDate, endDate) {
  if (startDate && endDate) {
    const start = formatDateForSheet(startDate);
    const end = formatDateForSheet(endDate);
    return start === end ? start : `${start} - ${end}`;
  }

  if (endDate) return formatDateForSheet(endDate);
  if (startDate) return formatDateForSheet(startDate);

  return "";
}

export default function AdminCompetitionForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState(INITIAL_STATE);
  const [posterFile, setPosterFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const payload = new FormData();
      const registrationDeadline = buildRangeText(formValues.registrationStart, formValues.registrationEnd);
      const preliminaryDate = buildRangeText(formValues.preliminaryStart, formValues.preliminaryEnd);

      payload.set("name", formValues.name);
      payload.set("organizer", formValues.organizer);
      payload.set("registrationDeadline", registrationDeadline);
      payload.set("preliminaryDate", preliminaryDate);
      payload.set("instagramLink", formValues.instagramLink);
      payload.set("linktree", formValues.linktree);
      payload.set("guidebookLink", formValues.guidebookLink);
      payload.set("registrationLink", formValues.registrationLink);
      payload.set("posterLink", formValues.posterLink);

      if (posterFile) {
        payload.set("posterFile", posterFile);
      }

      const response = await fetch("/api/admin/competitions", {
        method: "POST",
        body: payload
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan lomba.");
      }

      setResult({
        type: "success",
        message: `Lomba berhasil ditambahkan ke spreadsheet pada row ${data.rowNumber}.`,
        posterLink: data.posterLink || ""
      });
      setFormValues(INITIAL_STATE);
      setPosterFile(null);
      const fileInput = document.getElementById("posterFile");
      if (fileInput instanceof HTMLInputElement) {
        fileInput.value = "";
      }
      router.refresh();
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan lomba."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form admin-competition-form">
      <div className="admin-grid">
        <div className="field">
          <label htmlFor="name">Nama Lomba</label>
          <input id="name" name="name" value={formValues.name} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="organizer">Penyelenggara</label>
          <input id="organizer" name="organizer" value={formValues.organizer} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="registrationStart">Tanggal Pendaftaran</label>
          <div className="admin-date-grid">
            <input
              id="registrationStart"
              name="registrationStart"
              type="date"
              lang="en-GB"
              value={formValues.registrationStart}
              onChange={handleChange}
            />
            <input
              id="registrationEnd"
              name="registrationEnd"
              type="date"
              lang="en-GB"
              value={formValues.registrationEnd}
              onChange={handleChange}
              required
            />
          </div>
          <p className="field-hint">Isi tanggal mulai dan tanggal akhir pendaftaran melalui kalender.</p>
        </div>
        <div className="field">
          <label htmlFor="preliminaryStart">Tanggal Penyisihan</label>
          <div className="admin-date-grid">
            <input
              id="preliminaryStart"
              name="preliminaryStart"
              type="date"
              lang="en-GB"
              value={formValues.preliminaryStart}
              onChange={handleChange}
            />
            <input
              id="preliminaryEnd"
              name="preliminaryEnd"
              type="date"
              lang="en-GB"
              value={formValues.preliminaryEnd}
              onChange={handleChange}
            />
          </div>
          <p className="field-hint">Opsional. Jika belum ada jadwal penyisihan, kolom ini boleh dibiarkan kosong.</p>
        </div>
        <div className="field">
          <label htmlFor="instagramLink">Link Instagram</label>
          <input
            id="instagramLink"
            name="instagramLink"
            type="url"
            value={formValues.instagramLink}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="linktree">Linktree / Landing Page</label>
          <input id="linktree" name="linktree" type="url" value={formValues.linktree} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="guidebookLink">Link Guidebook</label>
          <input
            id="guidebookLink"
            name="guidebookLink"
            type="url"
            value={formValues.guidebookLink}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label htmlFor="registrationLink">Link Registrasi</label>
          <input
            id="registrationLink"
            name="registrationLink"
            type="url"
            value={formValues.registrationLink}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="admin-upload-block">
        <div className="field">
          <label htmlFor="posterFile">Upload Poster</label>
          <input
            id="posterFile"
            name="posterFile"
            type="file"
            accept="image/*"
            onChange={(event) => setPosterFile(event.target.files?.[0] || null)}
          />
          <p className="field-hint">Jika diisi, file akan di-upload ke Cloudinary dan link poster dibuat otomatis.</p>
        </div>
        <div className="field">
          <label htmlFor="posterLink">Atau Link Poster Manual</label>
          <input id="posterLink" name="posterLink" type="url" value={formValues.posterLink} onChange={handleChange} />
          <p className="field-hint">Gunakan ini jika poster sudah ada di hosting lain. Upload file akan diprioritaskan.</p>
        </div>
      </div>

      {result ? (
        <div className={result.type === "success" ? "form-success" : "form-error"}>
          {result.message}
          {result.posterLink ? (
            <>
              {" "}
              <a href={result.posterLink} target="_blank" rel="noreferrer">
                Lihat poster
              </a>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="admin-actions">
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan ke Spreadsheet"}
        </button>
      </div>
    </form>
  );
}
