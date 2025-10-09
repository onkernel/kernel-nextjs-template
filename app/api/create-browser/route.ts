import { NextResponse } from "next/server";
import { Kernel } from "@onkernel/sdk";

export async function POST() {
  try {
    const apiKey = process.env.KERNEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message: "KERNEL_API_KEY environment variable is not set",
          deployUrl:
            "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonkernel%2Fkernel-nextjs-template&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&integration-ids=oac_NEj8KPenfKQGUrRTVRrZL3vV&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D",
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Initialize Kernel client
    const kernel = new Kernel({ apiKey });

    // Create a headful, stealth browser
    console.log("Creating Kernel browser...");
    const browser = await kernel.browsers.create({
      stealth: true,
      headless: false,
    });
    console.log(`Browser created: ${browser.session_id}`);

    const spinUpTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sessionId: browser.session_id,
      liveViewUrl: browser.browser_live_view_url,
      cdpWsUrl: browser.cdp_ws_url,
      spinUpTime,
    });
  } catch (error) {
    console.error("Error creating browser:", error);
    return NextResponse.json(
      {
        error: "Failed to create browser",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
