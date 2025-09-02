import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let apiResults = [];

  // Intercept responses and capture the events JSON
  page.on("response", async (response) => {
    try {
      const url = response.url();

      // Look for Betika API endpoint that returns matches
      if (url.includes("/betting/events") || url.includes("/events")) {
        const json = await response.json();
        if (json && json.events) {
          apiResults = json.events; // store the full event list
        }
      }
    } catch {
      // ignore non-JSON responses
    }
  });

  await page.goto("https://www.betika.com/en-ke/s/soccer", {
    waitUntil: "networkidle2",
  });

  // Wait a bit for API responses to be intercepted
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log(`✅ Captured ${apiResults.length} matches from API`);

  // Transform into simplified structure
  const results = apiResults.map(ev => {
    return {
      id: ev.id,                      // the real unique match id
      league: ev.sportName,           // depends on API fields
      date: ev.startTime,             // full timestamp
      teams: {
        home: ev.homeTeam,
        away: ev.awayTeam,
      },
      odds: ev.odds ? {
        "1": ev.odds.fullTimeResult?.home || null,
        "X": ev.odds.fullTimeResult?.draw || null,
        "2": ev.odds.fullTimeResult?.away || null,
      } : {},
      markets: ev.markets?.length || 0,
    };
  });

  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
