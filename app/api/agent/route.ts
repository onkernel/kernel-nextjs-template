import { openai } from "@ai-sdk/openai";
import { playwrightExecuteTool } from "@onkernel/ai-sdk";
import { Kernel } from "@onkernel/sdk";
import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { z } from "zod";

export const maxDuration = 300; // 5 minutes timeout for long-running agent operations

export async function POST(req: Request) {
  try {
    const { sessionId, task } = await req.json();

    if (!sessionId || !task) {
      return Response.json(
        { error: "Missing sessionId or task" },
        { status: 400 }
      );
    }

    const apiKey = process.env.KERNEL_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "KERNEL_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!openaiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const kernel = new Kernel({ apiKey });

    // Initialize the AI agent with GPT-5-mini
    const agent = new Agent({
      model: openai("gpt-5.1"),
      tools: {
        playwright_execute: playwrightExecuteTool({
          client: kernel,
          sessionId: sessionId,
        }),
      },
      stopWhen: stepCountIs(20),
      system: `You are a browser automation expert. You help users execute tasks in their browser using Playwright.`,
    });

    // Execute the agent with the user's task
    const { text, steps, usage } = await agent.generate({
      prompt: task,
    });

    // Collect all executed code from the steps
    const executedCodes = steps
      .filter((step) => step.toolResults && step.toolResults.length > 0)
      .flatMap((step) =>
        step.toolResults!.map((toolResult) => {
          const result = toolResult as any;
          return {
            code: result.executedCode || "",
            success: result.success,
            result: result.result,
            error: result.error,
          };
        })
      )
      .filter((item) => item.code);

    return Response.json({
      success: true,
      response: text,
      executedCodes,
      stepCount: steps.length,
      usage,
    });
  } catch (error: any) {
    console.error("Agent execution error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to execute agent",
      },
      { status: 500 }
    );
  }
}
