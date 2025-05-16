// Note: LLM Generated
// todo: find a proper structured way to do it
const STORAGE_KEY = 'lastViewedHymns';

// Get hymns from localStorage
export function getLastViewedHymns() : string[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Add a new hymn UUID to the list
export function addLastViewedHymn(uuid: string) {
  let hymns = getLastViewedHymns();

  // Remove if already exists to re-add it at the top
  hymns = hymns.filter((id: string) => id !== uuid);

  // Add to the front
  hymns.unshift(uuid);

  // Trim to last 10
  if (hymns.length > 10) {
    hymns = hymns.slice(0, 10);
  }

  // Save back
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hymns));
}
