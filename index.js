const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { performance } = require("perf_hooks");
const axios = require("axios");
// const got = require("got");
const zlib = require("zlib");

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

app.post("/api", async (req, res) => {
  let options = {};
  let url = req.body.url;

  const isUsingPuppeteer = false;

  const a = performance.now();
  let data = "";

  try {
    if (isUsingPuppeteer) {
      if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        options = {
          args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
          defaultViewport: chrome.defaultViewport,
          executablePath: await chrome.executablePath,
          headless: true,
          ignoreHTTPSErrors: true,
        };
      }

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

      await page.setDefaultNavigationTimeout(10000);

      // "http://google.com"
      // "https://www.npmjs.com/package/puppeteer-extra-plugin-stealth",
      // "https://www.youtube.com/watch?v=4SjDI2kRzv4",
      //"https://www.amazon.com/Kingston-240GB-Solid-SA400S37-240G/dp/B01N5IB20Q/?_encoding=UTF8&pd_rd_w=LV88W&content-id=amzn1.sym.af3f3930-6cf5-4728-bec1-8977c33a811a&pf_rd_p=af3f3930-6cf5-4728-bec1-8977c33a811a&pf_rd_r=9E49XR9DN4RHWGXTZYNW&pd_rd_wg=2dy1n&pd_rd_r=d27003b6-c8e1-42ba-bf0e-db02ac7e6a0c&ref_=pd_gw_exports_top_sellers_unrec"

      await page.goto(url, { waitUntil: "networkidle2" });
      data = await page.content();
    } else {
      // const proxyUrl =
      //   "http://brd-customer-hl_32d5cbee-zone-zone1_shared_payperusage:1qlcoayay2kv@zproxy.lum-superproxy.io:22225";

      const axiosResponse = await axios.get(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
        },
        decompress: false,
        responseType: "arraybuffer",
        // proxy: false,
        // httpsAgent: new HttpsProxyAgent(proxyUrl),
      });

      data = zlib.gunzipSync(axiosResponse);

      // zlib.gunzip(axiosResponse, function (_err, output) {
      //   console.log(output.toString());
      // });

      // const bufferData = await got(url, {
      //   decompress: false,
      // }).buffer();
      // data = inflateRawSync(axiosResponse?.data).toString();

      // data = axiosResponse?.data;
    }

    const b = performance.now();
    res.json({ time: b - a + " ms.", data });
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
