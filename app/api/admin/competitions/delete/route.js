import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { deleteCompetitionRow } from "@/lib/admin-services";

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rowIndex = Number(body.rowIndex);
    const posterLink = String(body.posterLink || "");

    if (!Number.isInteger(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ error: "Row index tidak valid." }, { status: 400 });
    }

    await deleteCompetitionRow(rowIndex, posterLink);
    revalidateTag("competitions");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menghapus row."
      },
      { status: 500 }
    );
  }
}
