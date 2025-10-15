// User-Agent rotation utility
const USER_AGENTS = [
  'okhttp/4.9.0',
  'okhttp/4.10.0',
  'okhttp/4.11.0',
  'okhttp/4.12.0',
  'okhttp/5.0.0-alpha.2',
  'okhttp/5.1.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
];

export const getRandomUserAgent = (): string => {
  const randomIndex = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[randomIndex];
};
