import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 1. Go to the football list
  await page.goto("https://www.ke.sportpesa.com/en/sports-betting/football-1/", {
    waitUntil: "networkidle2",
  });

  // 2. Wait for matches to appear
  await page.waitForSelector(".event-names", { timeout: 30000 });

  // 3. Get all matches
  const matches = await page.$$(".event-names");
  console.log(`✅ Found ${matches.length} matches`);

  let results = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    // Extract teams before clicking
    const teams = await page.evaluate(el => {
      const teamEls = el.querySelectorAll(".event-team");
      return {
        home: teamEls[0]?.innerText.trim(),
        away: teamEls[1]?.innerText.trim()
      };
    }, match);

    const beforeUrl = page.url();

    // 4. Click the match
    await match.click();

    // 5. Wait for Angular to update the URL
    await page.waitForFunction(
      prev => window.location.href !== prev,
      {},
      beforeUrl
    );

    // 6. Get actual ID from new URL
    const url = page.url();
    const actualId = url.split("/").pop();

    results.push({
      teams,
      actualId,
    });

    console.log(`📌 ${teams.home} vs ${teams.away} → ID: ${actualId}`);

    // 7. Go back to the list page
    await page.goto("https://www.ke.sportpesa.com/en/sports-betting/football-1/", {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector(".event-names", { timeout: 30000 });
  }

  console.log("🎯 Final Results:", JSON.stringify(results, null, 2));

  await browser.close();
})();
