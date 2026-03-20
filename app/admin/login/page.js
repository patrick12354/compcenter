import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin Login | IRIS Competition Center"
};

export default async function AdminLoginPage({ searchParams }) {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin/lomba/new");
  }

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error || "";

  return (
    <main className="admin-shell">
      <div className="background-grid" />
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <section className="admin-auth-card">
        <img
          src="https://res.cloudinary.com/dg4jf2sag/image/upload/v1772438965/logo_iris_gftpz1.png"
          alt="IRIS"
          className="admin-logo"
        />
        <span className="panel-label">IRIS Admin</span>
        <h1 className="admin-title">Login untuk mengelola lomba</h1>
        <p className="admin-subtitle">
          Halaman ini dipakai admin untuk menambahkan lomba baru ke spreadsheet publik dan mengunggah poster.
        </p>
        <AdminLoginForm error={error} />
      </section>
    </main>
  );
}
