// scrape-league-events.js
import puppeteer from "puppeteer";

const league_name = "/2611672-world-cup-2026-qualification-afc"; // change this to scrape a different league

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const url = `https://22bet.co.ke/en/line/football${league_name}`;
  console.log("Scraping:", url);

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait until the events dashboard loads
  await page.waitForSelector(".dashboard.c-events", { timeout: 30000 });

  const leagueData = await page.evaluate(() => {
    const league = {};

    // League name + logo
    const leagueHeader = document.querySelector(".c-events__item_head");
    if (leagueHeader) {
      league.name =
        leagueHeader.querySelector(".c-events__liga")?.textContent.trim() || null;
      league.logo =
        leagueHeader.querySelector("img.champ-logo__img")?.src || null;
    }

    // Matches
    league.matches = [];
    const matchEls = document.querySelectorAll(
      ".c-events__item.c-events__item_col"
    );

    matchEls.forEach((matchEl) => {
      const time = matchEl.querySelector(".c-events__time span")?.textContent.trim() || null;

      const teamsEl = matchEl.querySelectorAll(".c-events__team");
      const teams = Array.from(teamsEl).map((t) => t.textContent.trim());

      const matchLinkEl = matchEl.querySelector(".c-events__name a");
      const matchUrl = matchLinkEl
        ? new URL(matchLinkEl.getAttribute("href"), window.location.origin).href
        : null;

      // Collect odds
      const oddsEls = matchEl.querySelectorAll(".c-bets__bet_sm .c-bets__inner");
      const odds = Array.from(oddsEls).map((o) => o.textContent.trim());

      league.matches.push({
        time,
        teams,
        url: matchUrl,
        odds,
      });
    });

    return league;
  });

  console.log(JSON.stringify(leagueData, null, 2));

  await browser.close();
})();
