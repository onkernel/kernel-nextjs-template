import { NextResponse } from "next/server";
import { chromium } from "playwright-core";

export async function POST(request: Request) {
  try {
    const { cdpWsUrl, url } = await request.json();

    if (!cdpWsUrl) {
      return NextResponse.json(
        { error: "cdpWsUrl is required" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Connect Playwright to the Kernel browser via CDP
    console.log("Connecting Playwright to browser...");
    const browser = await chromium.connectOverCDP(cdpWsUrl);

    // Get the default browser context and page
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // Navigate to the target URL and get the page title
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Close Playwright connection
    await browser.close();

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      title,
      url,
      executionTime,
    });
  } catch (error) {
    console.error("Error running automation:", error);
    return NextResponse.json(
      {
        error: "Failed to run automation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

