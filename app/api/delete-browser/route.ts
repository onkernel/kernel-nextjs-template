import { Kernel, NotFoundError } from "@onkernel/sdk";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const apiKey = process.env.KERNEL_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "KERNEL_API_KEY not configured" },
        { status: 500 }
      );
    }

    const kernel = new Kernel({ apiKey });

    try {
      await kernel.browsers.deleteByID(sessionId);

      return Response.json({
        success: true,
        message: "Browser session closed successfully",
      });
    } catch (error) {
      // Handle 404 gracefully - browser was already deleted or doesn't exist
      if (error instanceof NotFoundError) {
        return Response.json({
          success: true,
          message: "Browser session already closed or not found",
        });
      }

      // Re-throw other errors
      throw error;
    }
  } catch (error: any) {
    console.error("Browser deletion error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to close browser session",
      },
      { status: 500 }
    );
  }
}
