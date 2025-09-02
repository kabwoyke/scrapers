import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://odibets.com/sports/soccer", {
    waitUntil: "networkidle2",
    timeout: 20000,
  });

  // expand all leagues
  await page.$$eval(".games-league .f", (headers) => {
    headers.forEach((header) => header.click());
  });

  // wait until at least one expanded game is visible
  await page.waitForSelector(".games-league .h.show .game", { timeout: 10000 });

  const data = await page.evaluate(() => {
    const leagues = [];

    document.querySelectorAll(".games-league").forEach((leagueEl) => {
      const leagueName = leagueEl.querySelector(".l")?.innerText.trim() || "Unknown League";

      const games = [];
      leagueEl.querySelectorAll(".game").forEach((gameEl) => {
        const teams = [...gameEl.querySelectorAll(".t-l")].map((t) => t.innerText.trim());
        const meta = gameEl.querySelector(".t-m");
        const time = meta?.querySelector(".font-bold")?.innerText.trim() || null;
        const matchId = meta?.childNodes[1]?.textContent.trim() || null;

        const odds = {
          "1X2": {},
          "Double Chance": {},
          "GG/NG": {}
        };

        gameEl.querySelectorAll(".odds .o").forEach((oddsGroup) => {
          const groupClass = oddsGroup.className;

          let group = "Other";
          if (groupClass.includes("s-1")) group = "1X2";
          if (groupClass.includes("s-2")) group = "Double Chance";
          if (groupClass.includes("s-3")) group = "GG/NG";

          oddsGroup.querySelectorAll("button").forEach((btn) => {
            const label = btn.querySelector(".o-1")?.childNodes[0]?.textContent.trim() || "";
            const value = btn.querySelector(".o-2")?.innerText.trim() || "";
            if (label && value) odds[group][label] = value;
          });
        });

        games.push({
          home: teams[0] || null,
          away: teams[1] || null,
          time,
          matchId,
          odds,
        });
      });

      leagues.push({
        league: leagueName,
        games,
      });
    });

    return leagues;
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
