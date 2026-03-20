"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_STATE = {
  name: "",
  organizer: "",
  registrationDeadline: "",
  preliminaryDate: "",
  instagramLink: "",
  linktree: "",
  guidebookLink: "",
  registrationLink: "",
  posterLink: ""
};

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
      Object.entries(formValues).forEach(([key, value]) => payload.set(key, value));
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
          <label htmlFor="registrationDeadline">Tanggal Pendaftaran</label>
          <input
            id="registrationDeadline"
            name="registrationDeadline"
            value={formValues.registrationDeadline}
            onChange={handleChange}
            placeholder="Contoh: 9 - 28 Februari 2026"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="preliminaryDate">Tanggal Penyisihan</label>
          <input
            id="preliminaryDate"
            name="preliminaryDate"
            value={formValues.preliminaryDate}
            onChange={handleChange}
            placeholder="Contoh: 1 Maret - 10 April 2026"
          />
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
