export function formatDeadlineStatus(deadlineInfo) {
  return deadlineInfo.badge;
}

export function buildCalendarLink(competition) {
  const title = encodeURIComponent(`Deadline Lomba: ${competition.name}`);
  const details = encodeURIComponent(
    [
      `Penyelenggara: ${competition.organizer}`,
      `Deadline: ${competition.deadlineText || "TBA"}`,
      `Registrasi: ${competition.registrationLink || "-"}`,
      `Guidebook: ${competition.guidebookLink || "-"}`
    ].join("\n")
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
}

export function getShareCopy(competition) {
  return [
    "Ada lomba yang layak masuk radar IRIS:",
    "",
    competition.name,
    `Penyelenggara: ${competition.organizer}`,
    `Deadline: ${competition.deadlineText || "TBA"}`,
    `Penyisihan: ${competition.prelimText || "TBA"}`,
    "",
    `Registrasi: ${competition.registrationLink || "-"}`,
    `Guidebook: ${competition.guidebookLink || "-"}`
  ].join("\n");
}
