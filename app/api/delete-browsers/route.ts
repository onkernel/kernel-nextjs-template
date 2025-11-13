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
        },
        { status: 400 }
      );
    }

    // Get session IDs from request body
    const body = await request.json();
    const { sessionIdA, sessionIdB } = body;

    if (!sessionIdA || !sessionIdB) {
      return NextResponse.json(
        {
          error: "Both session IDs are required",
        },
        { status: 400 }
      );
    }

    // Initialize Kernel client
    const kernel = new Kernel({ apiKey });

    console.log(`Deleting browsers: ${sessionIdA}, ${sessionIdB}`);

    // Delete both browsers in parallel
    await Promise.all([
      kernel.browsers.deleteByID(sessionIdA),
      kernel.browsers.deleteByID(sessionIdB),
    ]);

    console.log("Both browsers deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Browsers deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting browsers:", error);
    return NextResponse.json(
      {
        error: "Failed to delete browsers",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
