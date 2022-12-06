const app = require("express")();

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
    await page.goto(
      "https://www.whatismybrowser.com/detect/what-is-my-user-agent/"
    );
    res.json({ data: await page.content() });
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
