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
        { error: "KERNEL_API_KEY environment variable is not set" },
        { status: 400 }
      );
    }

    if (!openaiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY environment variable is not set" },
        { status: 400 }
      );
    }

    const kernel = new Kernel({ apiKey });

    // Initialize the AI agent with GPT-5.1
    const agent = new Agent({
      model: openai("gpt-5.1"),
      tools: {
        playwright_execute: playwrightExecuteTool({
          client: kernel,
          sessionId: sessionId,
        }),
      },
      stopWhen: stepCountIs(20),
      system: `You are a browser automation expert with access to a Playwright execution tool.

Available tools:
- playwright_execute: Executes JavaScript/Playwright code in the browser. Has access to 'page', 'context', and 'browser' objects. Returns the result of your code.

When given a task:
1. If no URL is provided, FIRST get the current page context:
   return { url: page.url(), title: await page.title() }
2. If a URL is provided, navigate to it using page.goto()
3. Use appropriate selectors (page.locator, page.getByRole, etc.) to interact with elements
4. Always return the requested data from your code execution

Important: Write concise code that solves one atomic step at a time. Break complex tasks into small, focused executions rather than writing long scripts.

Execute tasks autonomously without asking clarifying questions. Make reasonable assumptions and proceed.`,
    });

    // Execute the agent with the user's task
    const { text, steps, usage } = await agent.generate({
      prompt: task,
    });

    // Extract detailed step information from step.content[] array
    const detailedSteps = steps.map((step, index) => {
      const stepData = step as any;
      const content = stepData.content || [];

      console.log(content);

      // Process each content item based on its type
      const processedContent = content.map((item: any) => {
        if (item.type === "tool-call") {
          return {
            type: "tool-call" as const,
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            code: item.input?.code || null,
          };
        } else if (item.type === "tool-result") {
          return {
            type: "tool-result" as const,
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            result: item.result?.result,
            success: item.result?.success ?? true,
            error: item.result?.error,
          };
        } else if (item.type === "text") {
          return {
            type: "text" as const,
            text: item.text,
          };
        }
        return item;
      });

      return {
        stepNumber: index + 1,
        finishReason: stepData.finishReason || null,
        content: processedContent,
      };
    });

    // Collect all executed code from the steps (for backward compatibility)
    const executedCodes = detailedSteps.flatMap((step) =>
      step.content
        .filter((item: any) => item.type === "tool-call" && item.code)
        .map((item: any) => {
          // Find matching result
          const result = step.content.find(
            (r: any) =>
              r.type === "tool-result" && r.toolCallId === item.toolCallId
          );
          return {
            code: item.code,
            success: result?.success ?? true,
            result: result?.result,
            error: result?.error,
          };
        })
    );

    return Response.json({
      success: true,
      response: text,
      executedCodes,
      detailedSteps,
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
