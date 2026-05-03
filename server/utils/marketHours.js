// NYSE hours only: 9:30 AM – 4:00 PM Eastern Time
// ET = UTC-5 (EST) or UTC-4 (EDT during daylight saving)
// Simplification: use UTC-4 (EDT) as approximation for most of the year
// NYSE open = 13:30 UTC, NYSE close = 20:00 UTC
// In IST: 7:00 PM to 1:30 AM IST (next day)

const isNYSEOpen = () => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  // NYSE: 13:30 UTC to 20:00 UTC (accounts for EDT, most of year)
  // During EST (Nov-Mar): 14:30 UTC to 21:00 UTC
  // Use 13:30–21:00 to be safe and cover both EST and EDT
  return totalMinutes >= 810 && totalMinutes < 1260;
};

const isMarketOpen = isNYSEOpen;

// Returns milliseconds until NYSE opens next
const getMsUntilMarketOpen = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nyseOpenMinutes = 810; // 13:30 UTC

  // If market will open later today (weekday, before open)
  if (day >= 1 && day <= 5 && totalMinutes < nyseOpenMinutes) {
    return (nyseOpenMinutes - totalMinutes) * 60 * 1000;
  }

  // Calculate minutes until next Monday or next weekday 13:30 UTC
  let daysAhead = 0;
  if (day === 5 && totalMinutes >= 1260) daysAhead = 3; // Friday after close → Monday
  else if (day === 6) daysAhead = 2; // Saturday → Monday
  else if (day === 0) daysAhead = 1; // Sunday → Monday
  else daysAhead = 1; // Weekday after close → next day

  const msUntilMidnight = (24 * 60 - totalMinutes) * 60 * 1000;
  const msForExtraDays = (daysAhead - 1) * 24 * 60 * 60 * 1000;
  const msUntilOpen = nyseOpenMinutes * 60 * 1000;

  return msUntilMidnight + msForExtraDays + msUntilOpen;
};

const getMarketStatusLabel = () => {
  if (isNYSEOpen()) return 'NYSE Open';
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return 'Weekend — Market Closed';
  return 'Market Closed';
};

module.exports = { isNYSEOpen, isMarketOpen, getMsUntilMarketOpen, getMarketStatusLabel };
