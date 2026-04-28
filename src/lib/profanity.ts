// Basic word blocklist. In a real app this would be more comprehensive.
const blocklist = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick'];

// Replace profanity with asterisks, or reject entirely. 
// For this simple version, we'll just check if it contains bad words
export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase();
  for (const word of blocklist) {
    // Check for exact word matches using boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}

export function filterProfanity(text: string): string {
  let filtered = text;
  for (const word of blocklist) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  return filtered;
}
