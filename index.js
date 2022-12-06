const app = require("express")();
const { performance } = require("perf_hooks");

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  // puppeteer = require("puppeteer-core");

  puppeteer = require("puppeteer-extra");
  // const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
  // puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

  // Add the Imports before StealthPlugin
  require("puppeteer-extra-plugin-stealth/evasions/chrome.app");
  require("puppeteer-extra-plugin-stealth/evasions/chrome.csi");
  require("puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes");
  require("puppeteer-extra-plugin-stealth/evasions/chrome.runtime");
  require("puppeteer-extra-plugin-stealth/evasions/defaultArgs"); // pkg warned me this one was missing
  require("puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow");
  require("puppeteer-extra-plugin-stealth/evasions/media.codecs");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.languages");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.permissions");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.plugins");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.vendor");
  require("puppeteer-extra-plugin-stealth/evasions/navigator.webdriver");
  require("puppeteer-extra-plugin-stealth/evasions/sourceurl");
  require("puppeteer-extra-plugin-stealth/evasions/user-agent-override");
  require("puppeteer-extra-plugin-stealth/evasions/webgl.vendor");
  require("puppeteer-extra-plugin-stealth/evasions/window.outerdimensions");
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");

  puppeteer.use(StealthPlugin());

  const userPrefs = require("puppeteer-extra-plugin-user-preferences");
  puppeteer.use(userPrefs());

  const dir = require("puppeteer-extra-plugin-user-data-dir");
  puppeteer.use(dir());
} else {
  puppeteer = require("puppeteer");
} //

app.get("/api", async (req, res) => {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();

    const blockedResources = [
      // Assets
      "*/favicon.ico",
      ".css",
      ".jpg",
      ".jpeg",
      ".gif",
      ".png",
      ".svg",
      ".woff",

      // Analytics and other fluff
      "*.optimizely.com",
      "everesttech.net",
      "userzoom.com",
      "doubleclick.net",
      "googleadservices.com",
      "adservice.google.com/*",
      "connect.facebook.com",
      "connect.facebook.net",
      "sp.analytics.yahoo.com",
    ];

    await page._client.send("Network.setBlockedURLs", {
      urls: blockedResources,
    });

    const a = performance.now();

    await page.goto(
      "http://google.com"
      // "https://www.youtube.com/watch?v=4SjDI2kRzv4"
      //"https://www.amazon.com/Kingston-240GB-Solid-SA400S37-240G/dp/B01N5IB20Q/?_encoding=UTF8&pd_rd_w=LV88W&content-id=amzn1.sym.af3f3930-6cf5-4728-bec1-8977c33a811a&pf_rd_p=af3f3930-6cf5-4728-bec1-8977c33a811a&pf_rd_r=9E49XR9DN4RHWGXTZYNW&pd_rd_wg=2dy1n&pd_rd_r=d27003b6-c8e1-42ba-bf0e-db02ac7e6a0c&ref_=pd_gw_exports_top_sellers_unrec"
    );

    const b = performance.now();

    res.json({ time: b - a + " ms.", data: await page.content() });
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
