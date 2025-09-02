import puppeteer from "puppeteer";

async function scrapeLeague(leagueId) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const url = `https://22bet.co.ke/line/football/${leagueId}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // wait for matches to appear
  await page.waitForSelector(".c-events__item", { timeout: 10000 });

  const matches = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".c-events__item")).map((el) => {
      const time = el.querySelector(".c-events__time span")?.textContent.trim();
      const teams = Array.from(el.querySelectorAll(".c-events__team")).map((t) =>
        t.textContent.trim()
      );
      const matchLink = el.querySelector("a.c-events__name")?.getAttribute("href");
      const odds = Array.from(el.querySelectorAll(".c-bets__inner")).map((o) =>
        o.textContent.trim()
      );

      return {
        time,
        teams,
        url: matchLink
          ? `https://22bet.co.ke/${matchLink.startsWith("/") ? matchLink.slice(1) : matchLink}`
          : null,
        matchId: matchLink
          ? matchLink.split("/")[3].split("-")[0] // extract ID (e.g. 276715479)
          : null,
        odds,
      };
    });
  });

  await browser.close();

  return {
    leagueId,
    matches,
  };
}

// Example run
scrapeLeague("118587-uefa-champions-league").then((data) => {
  console.log(JSON.stringify(data, null, 2));
});
