import Link from "next/link";
import AdminCompetitionForm from "@/components/admin-competition-form";
import AdminCompetitionList from "@/components/admin-competition-list";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminCompetitions } from "@/lib/admin-services";

export const metadata = {
  title: "Tambah Lomba | IRIS Competition Center"
};

export default async function NewCompetitionPage() {
  await requireAdminSession();
  const competitions = await getAdminCompetitions();

  return (
    <main className="admin-shell">
      <div className="background-grid" />
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <section className="admin-page">
        <div className="admin-topbar">
          <div>
            <span className="panel-label">IRIS Admin</span>
            <h1 className="admin-title">Tambah lomba baru</h1>
            <p className="admin-subtitle">
              Form ini akan menulis row baru ke sheet utama. Poster bisa diisi lewat upload Cloudinary atau link manual.
            </p>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="secondary-button">
              Back to Home
            </Link>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="secondary-button">
                Logout
              </button>
            </form>
          </div>
        </div>

        <AdminCompetitionForm />
        <AdminCompetitionList competitions={competitions} />
      </section>
    </main>
  );
}
