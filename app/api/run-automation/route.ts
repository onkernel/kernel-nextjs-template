import { NextResponse } from "next/server";
import { startBrowserAgent } from "magnitude-core";
import { z } from "zod";

function normalizeUrl(url: string): string {
  if (!url) return url;

  const trimmed = url.trim();

  // Check if URL already has a protocol
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Prepend https:// if no protocol is present
  return `https://${trimmed}`;
}

export async function POST(request: Request) {
  try {
    const { cdpWsUrl, url, task } = await request.json();

    if (!cdpWsUrl) {
      return NextResponse.json(
        { error: "CDP WebSocket URL is required" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    // Normalize URL to ensure it has a protocol
    const normalizedUrl = normalizeUrl(url);

    if (!task) {
      return NextResponse.json(
        { error: "task is required" },
        { status: 400 }
      );
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Run automation on single browser
    console.log("Starting Magnitude agent...");

    const result = await runMagnitudeAutomation(cdpWsUrl, normalizedUrl, task, anthropicApiKey);

    return NextResponse.json(result);
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

async function runMagnitudeAutomation(
  cdpWsUrl: string,
  startingUrl: string,
  task: string,
  anthropicApiKey: string
) {
  const startTime = Date.now();

  try {
    console.log(`Starting agent for URL: ${startingUrl}, Task: ${task}`);

    // Initialize Magnitude agent
    const agent = await startBrowserAgent({
      browser: {
        cdp: cdpWsUrl,
      },
      llm: {
        provider: "anthropic",
        options: {
          model: "claude-sonnet-4-5-20250929",
          apiKey: anthropicApiKey,
        },
      },
    });

    // Execute the user's natural language task
    let result = "";
    let summary = "";
    try {
      await agent.nav(startingUrl);
      await agent.act([task]);

      // Extract structured output with result and summary
      const extractedData = await agent.extract(
        "Provide a structured response",
        z.object({
          result: z.string().describe("The direct answer or result of the task requested"),
          summary: z.string().describe("A brief summary of the steps taken to complete the task")
        })
      );

      result = extractedData.result;
      summary = extractedData.summary;
    } catch (actError) {
      // If act fails, try to extract what was attempted
      try {
        const attemptData = await agent.extract(
          "Describe what you attempted",
          z.object({
            result: z.string().describe("What you were trying to accomplish"),
            summary: z.string().describe("What steps you attempted before encountering the issue")
          })
        );
        result = attemptData.result;
        summary = attemptData.summary;
      } catch {
        // If extraction also fails, use empty strings
        result = "";
        summary = "";
      }

      // Re-throw with context
      const errorMessage = actError instanceof Error ? actError.message : String(actError);
      throw new Error(`Task could not be completed: ${errorMessage}`);
    }

    const executionTime = Date.now() - startTime;

    console.log(`Agent completed successfully. Result: ${result}`);

    return {
      success: true,
      executionTime,
      result,
      summary,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error("Agent error:", error);

    return {
      success: false,
      executionTime,
      result: "",
      summary: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

