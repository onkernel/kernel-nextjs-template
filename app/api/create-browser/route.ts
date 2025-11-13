import { NextResponse } from "next/server";
import { Kernel } from "@onkernel/sdk";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.KERNEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message: "KERNEL_API_KEY environment variable is not set",
          deployUrl:
            "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonkernel%2Fkernel-nextjs-template&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D",
        },
        { status: 400 }
      );
    }

    // Get extension ID from request body
    const body = await request.json();
    const extensionId = body.extensionId;
    const extensionName = body.extensionName;

    // Initialize Kernel client
    const kernel = new Kernel({ apiKey });

    // Create browsers sequentially to get accurate individual spin-up times
    console.log("Creating dual Kernel browsers...");

    // Browser A first
    const startTimeA = Date.now();
    const browserA = await kernel.browsers.create({
      stealth: true,
      headless: false,
      timeout_seconds: 120,
    });
    const spinUpTimeA = Date.now() - startTimeA;
    console.log(`Browser A created: ${browserA.session_id} (${spinUpTimeA}ms)`);

    // Browser B second
    const startTimeB = Date.now();
    const browserB = await kernel.browsers.create({
      stealth: true,
      headless: false,
      timeout_seconds: 120,
      extensions: extensionName ? [{ name: extensionName }] : [],
    });
    const spinUpTimeB = Date.now() - startTimeB;
    console.log(`Browser B created: ${browserB.session_id} (${spinUpTimeB}ms)`);

    return NextResponse.json({
      success: true,
      browserA: {
        sessionId: browserA.session_id,
        liveViewUrl: browserA.browser_live_view_url,
        cdpWsUrl: browserA.cdp_ws_url,
        spinUpTime: spinUpTimeA,
      },
      browserB: {
        sessionId: browserB.session_id,
        liveViewUrl: browserB.browser_live_view_url,
        cdpWsUrl: browserB.cdp_ws_url,
        spinUpTime: spinUpTimeB,
      },
      extensionId,
      extensionName,
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
