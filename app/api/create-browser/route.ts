import { NextResponse } from "next/server";
import { Kernel } from "@onkernel/sdk";

export async function POST() {
  try {
    const apiKey = process.env.KERNEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "KERNEL_API_KEY environment variable is not set" },
        { status: 500 }
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

