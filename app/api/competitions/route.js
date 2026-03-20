import { getCompetitions } from "@/lib/competition-data";

export const revalidate = 900;

export async function GET() {
  try {
    const competitions = await getCompetitions();
    return Response.json({ competitions });
  } catch (error) {
    return Response.json(
      { competitions: [], error: "Spreadsheet source tidak bisa diambil." },
      { status: 502 }
    );
  }
}
