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
      system: `You are a browser automation expert. You help users execute tasks in their browser using Playwright. If no specific page is mentioned or can be inferred, you should start by getting the html content and URL of the current page. Don't ask questions to the user.`,
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
            result: item.result,
            success: item.result?.success ?? true,
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
