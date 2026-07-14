// createdAt is stored as a full-precision ISO-8601 string on disk (see
// CLAUDE.md — machine-readable, sortable) but that's not something a user
// should ever have to read; format it for display only.
export function formatCreatedAt(isoString: string): string {
  return new Date(isoString).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
