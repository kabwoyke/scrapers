import puppeteer from "puppeteer";

async function scrapeBetikaWithAPI() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Intercept JSON responses
  page.on("response", async (response) => {
    const url = response.url();

    // Look for Betika's hidden API endpoints
    if (
      url.includes("/matches") || 
      url.includes("/match?parent_match_id") || 
      url.includes("/markets")
    ) {
      try {
        const headers = response.headers();
        if (headers["content-type"]?.includes("application/json")) {
          const json = await response.json();
          console.log("\n🔥 API Response:", url);
          console.log(JSON.stringify(json, null, 2));
        }
      } catch (e) {
        // skip if not JSON
      }
    }
  });

  // Open Betika soccer page to trigger API calls
  await page.goto("https://www.betika.com/en-ke/s/soccer", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Let it run for a while to catch all requests
  await page.waitForTimeout(10000);

  await browser.close();
}

scrapeBetikaWithAPI().catch(console.error);
