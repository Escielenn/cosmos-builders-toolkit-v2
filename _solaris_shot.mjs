import { chromium } from "playwright";
const base = "http://localhost:8080/dev/solaris";
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--ignore-gpu-blocklist","--enable-webgl"]
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(4500);
const hasCanvas = await page.locator("canvas").count();
const title = await page.title();
const bodyText = (await page.locator("body").innerText()).slice(0, 300);
await page.screenshot({ path: "docs/solaris-native-m1.png" });
let follow = false;
try {
  await page.getByRole("button", { name: /Terra|Rust|Colossus|Cinder/ }).first().click({ timeout: 3000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "docs/solaris-native-m1-follow.png" });
  follow = true;
} catch (e) { errors.push("follow-click: " + e.message); }
console.log("RESULT " + JSON.stringify({ title, hasCanvas, errorsCount: errors.length, errors: errors.slice(0,8), bodyText, follow }));
await browser.close();
