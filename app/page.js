import CompetitionCenter from "@/components/competition-center";
import { getCompetitionInsights, getCompetitions } from "@/lib/competition-data";

export const revalidate = 900;

export default async function HomePage() {
  let competitions = [];
  let fetchError = false;

  try {
    competitions = await getCompetitions();
  } catch (error) {
    fetchError = true;
  }

  const insights = getCompetitionInsights(competitions);

  return <CompetitionCenter competitions={competitions} insights={insights} fetchError={fetchError} />;
}
