export function generateSaveFileContent() {
  const localStorageContent: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) as string;
    // Avoid including recovery info in the recovery info
    if (["recovery_data"].includes(key)) continue;
    const value = localStorage.getItem(key) as string;
    localStorageContent[key] = value;
  }
  return JSON.stringify(localStorageContent);
}
