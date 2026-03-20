import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  appendCompetitionToSheet,
  normalizeCompetitionSubmission,
  uploadPosterToCloudinary,
  validateCompetitionSubmission
} from "@/lib/admin-services";

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const posterFile = formData.get("posterFile");
    const manualPosterLink = String(formData.get("posterLink") || "").trim();

    let posterLink = manualPosterLink;

    if (posterFile instanceof File && posterFile.size > 0) {
      posterLink = await uploadPosterToCloudinary(posterFile);
    }

    const payload = normalizeCompetitionSubmission({
      name: formData.get("name"),
      organizer: formData.get("organizer"),
      registrationDeadline: formData.get("registrationDeadline"),
      preliminaryDate: formData.get("preliminaryDate"),
      instagramLink: formData.get("instagramLink"),
      linktree: formData.get("linktree"),
      guidebookLink: formData.get("guidebookLink"),
      registrationLink: formData.get("registrationLink"),
      posterLink
    });

    const validationErrors = validateCompetitionSubmission(payload);
    if (validationErrors.length) {
      return NextResponse.json({ error: validationErrors.join(" ") }, { status: 400 });
    }

    const result = await appendCompetitionToSheet(payload);
    revalidateTag("competitions");

    return NextResponse.json({
      success: true,
      posterLink,
      rowNumber: result.rowNumber
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menyimpan lomba."
      },
      { status: 500 }
    );
  }
}
