// scrape-1xbet-id-structured.js
import puppeteer from "puppeteer";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrape1xBet() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 900 });

  try {
    await page.goto("https://1xbet.co.ke/en/line/football", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Scroll to load enough games
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await delay(1200);
    }

    const data = await page.evaluate(() => {
      const leagues = [];

      document.querySelectorAll(".dashboard__champ").forEach((champ) => {
        const leagueName =
          champ.querySelector(".dashboard-champ-name")?.textContent.trim() ||
          "Unknown League";

        const games = [];
        champ.querySelectorAll(".dashboard-champ__game").forEach((game) => {
          const teams = Array.from(
            game.querySelectorAll(".ui-caption")
          ).map((t) => t.textContent.trim());

          const date =
            game.querySelector(".dashboard-game-info__date")?.textContent.trim() ||
            null;
          const time =
            game.querySelector(".dashboard-game-info__time")?.textContent.trim() ||
            null;

          // Extract href and split IDs
          const link = game.querySelector(".dashboard-game-block-link");
          let leagueId = null;
          let matchId = null;
          if (link) {
            const href = link.getAttribute("href");
            const parts = href.split("/").filter(Boolean);
            leagueId = parts[3] || null; // e.g. "119599-argentina-primera-division"
            matchId = parts[4] || null;  // e.g. "275819663-gimnasia-y-esgrima-la-plata-atletico-tucuman"
          }

          // Grab odds (first 3 = 1X2)
          const allOdds = Array.from(
            game.querySelectorAll(".dashboard-markets__market .ui-market__value")
          ).map((el) => el.textContent.trim());

          const odds = {
            "1": allOdds[0] || null,
            X: allOdds[1] || null,
            "2": allOdds[2] || null,
            others: allOdds.slice(3),
          };

          games.push({
            leagueId,
            matchId,
            link: link?.href || null,
            teams: {
              home: teams[0] || null,
              away: teams[1] || null,
            },
            date,
            time,
            odds,
          });
        });

        leagues.push({ league: leagueName, games });
      });

      return leagues;
    });

    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error scraping 1xBet:", err);
  } finally {
    await browser.close();
  }
}

scrape1xBet();
