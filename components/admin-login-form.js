"use client";

export default function AdminLoginForm({ error }) {
  const message =
    error === "invalid_credentials" ? "Password admin salah." : error ? "Terjadi error saat login." : "";

  return (
    <form action="/api/admin/login" method="post" className="admin-form">
      <div className="field">
        <label htmlFor="password">Password Admin</label>
        <input id="password" name="password" type="password" placeholder="Masukkan password admin" required />
      </div>
      {message ? <p className="form-error">{message}</p> : null}
      <button type="submit" className="primary-button full-width">
        Login
      </button>
    </form>
  );
}
