import puppeteer from "puppeteer";

// Simple sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,  // ✅ Run in background
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.betika.com/en-ke/s/soccer", {
    waitUntil: "domcontentloaded"
  });

  // Vue apps load async → wait until matches render
  await page.waitForFunction(
    () => document.querySelectorAll(".prebet-match").length > 0,
    { timeout: 30000 }
  );

  // 🔽 Infinite scroll helper
  async function autoScroll(page) {
    let prevHeight = await page.evaluate("document.body.scrollHeight");
    while (true) {
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await sleep(2000); // wait for lazy loading
      let newHeight = await page.evaluate("document.body.scrollHeight");
      if (newHeight === prevHeight) break;
      prevHeight = newHeight;
    }
  }

  console.log("⏳ Scrolling to load all matches...");
  await autoScroll(page);

  // ✅ Now scrape all matches
  const matches = await page.$$(".prebet-match");
  console.log(`✅ Found ${matches.length} matches`);

  let results = [];

  for (const match of matches) {
    const matchData = await page.evaluate(el => {
      const league = el.querySelector(".time span")?.innerText.trim() || null;
      const dateTimeText = el.querySelector(".time")?.innerText.trim() || "";
      const [date, time] = dateTimeText.split("\n").map(s => s.trim());

      const home = el.querySelector(".prebet-match__teams__home")?.innerText.trim() || null;
      const away = el.querySelector(".prebet-match__teams span:nth-child(2)")?.innerText.trim() || null;

      const oddsEls = el.querySelectorAll(".prebet-match__odd__odd-value");
      const odds = oddsEls.length >= 3 ? {
        "1": oddsEls[0].innerText,
        "X": oddsEls[1].innerText,
        "2": oddsEls[2].innerText
      } : {};

      const markets = el.querySelector(".prebet-match__markets")?.innerText.trim() || null;

      return { league, date, time, teams: { home, away }, odds, markets };
    }, match);

    results.push(matchData);
  }

  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
