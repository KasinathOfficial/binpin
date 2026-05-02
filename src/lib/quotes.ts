export const BIN_QUOTES = [
  "Small acts, when multiplied by millions of people, can transform the world. — Howard Zinn",
  "The greatest threat to our planet is the belief that someone else will save it. — Robert Swan",
  "We don't inherit the earth from our ancestors, we borrow it from our children. — Native American Proverb",
  "Cleanliness is a state of mind, and a state of heart. — Mahatma Gandhi",
  "Every bin tagged is a step toward a cleaner neighborhood. Thank you!",
  "Nature provides a free lunch, but only if we control our appetites. — William Ruckelshaus",
  "Earth provides enough to satisfy every man's needs, but not every man's greed. — Mahatma Gandhi",
  "The environment is where we all meet; where we all have a mutual interest. — Lady Bird Johnson",
  "Waste is only waste if we waste it. Your tagging helps us manage better!",
  "A cleaner environment leads to a healthier tomorrow. You're making it happen!",
  "Sustainability is no longer about doing less harm. It’s about doing more good.",
  "You are now a BinPin Guardian! Your contribution keeps the city breathing.",
  "One person can make a difference, and everyone should try. — JFK"
];

export const getRandomQuote = () => {
  return BIN_QUOTES[Math.floor(Math.random() * BIN_QUOTES.length)];
};
