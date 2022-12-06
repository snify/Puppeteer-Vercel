const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  // puppeteer = require("puppeteer-core");
  puppeteer = require("puppeteer-extra");
  // const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  // puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
  puppeteer.use(StealthPlugin());
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
