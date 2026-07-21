export async function searchTracks(query, maxResults = 20) {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const res = await fetch(`/api/search?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Search request failed.");
  }
  return data.tracks;
}
