import { Kernel } from "@onkernel/sdk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.KERNEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "KERNEL_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const kernel = new Kernel({ apiKey });

    // Fetch the list of browser extensions
    const extensions = await kernel.extensions.list();

    // Map to include only id and name
    const extensionsList = extensions.map((ext: any) => ({
      id: ext.id,
      name: ext.name,
    }));

    return NextResponse.json({ extensions: extensionsList });
  } catch (error) {
    console.error("Error fetching extensions:", error);
    return NextResponse.json(
      { error: "Failed to fetch extensions" },
      { status: 500 }
    );
  }
}
