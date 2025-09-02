// scrape-22bet-leagues-events.js
import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto("https://22bet.co.ke/en/line/football", {
    waitUntil: "domcontentloaded",
  });

  // Wait until the main league list appears
  await page.waitForFunction(
    () => document.querySelectorAll(".liga_menu li").length > 0,
    { timeout: 30000 }
  );

  // Extract leagues + their events
  const leagues = await page.evaluate(() => {
    const leagueEls = document.querySelectorAll(".liga_menu > li");
    let results = [];

    leagueEls.forEach((el) => {
      const link = el.querySelector("a.link");
      if (!link) return;

      const name = link.innerText.trim().replace(/\s+/g, " ");
      const href = link.getAttribute("href");
      const logoEl = el.querySelector("img.champ-logo__img");
      const logo = logoEl ? logoEl.src : null;

      // 🔽 Capture sub-events inside .event_menu
      let events = [];
      const eventEls = el.querySelectorAll(".event_menu > li a.link");
      eventEls.forEach((ev) => {
        events.push({
          name: ev.innerText.trim().replace(/\s+/g, " "),
          url: ev.getAttribute("href")
            ? new URL(ev.getAttribute("href"), window.location.origin).href
            : null,
        });
      });

      results.push({
        name,
        url: href ? new URL(href, window.location.origin).href : null,
        logo,
        events,
      });
    });

    return results;
  });

  console.log(JSON.stringify(leagues, null, 2));

  await browser.close();
})();
