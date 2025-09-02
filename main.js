import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();

await page.goto(`https://www.mozzartbet.co.ke/en#/match/9105336`, {
  waitUntil: "networkidle2",
  timeout: 20000,
});

// wait until at least one odds block appears
await page.waitForSelector(".odds", { timeout: 20000 });

const odds = await page.evaluate(() => {
  // we want these markets (case-insensitive, partial match allowed)
  const wantedKeywords = [
    "over/under",
    "under/over",
    "total goals", // covers "Total Goals - Under/Over"
    "draw no bet",
    "both teams to score",
  ];

  return Array.from(document.querySelectorAll(".odds"))
    .map((block) => {
      const title = block.querySelector(".oddsName")?.textContent?.trim() || "";

      return {
        title,
        values: Array.from(
          block.querySelectorAll(".valuesHolder .odd")
        ).map((el) => ({
          name: el.querySelector(".oddssubname")?.textContent?.trim() || "",
          value: el.querySelector(".odd-font")?.textContent?.trim() || "",
        })),
      };
    })
    // keep only wanted ones (case-insensitive check)
    .filter((o) =>
      wantedKeywords.some((kw) =>
        o.title.toLowerCase().includes(kw.toLowerCase())
      )
    );
});

console.log(JSON.stringify(odds, null, 2));

await browser.close();
