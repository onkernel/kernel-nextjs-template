"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Code2,
  MessageSquare,
  Terminal,
} from "lucide-react";

interface StepContentItem {
  type: "tool-call" | "tool-result" | "text";
  toolCallId?: string;
  toolName?: string;
  code?: string;
  result?: any;
  success?: boolean;
  text?: string;
}

interface DetailedStep {
  stepNumber: number;
  finishReason: string | null;
  content: StepContentItem[];
}

interface StepsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: DetailedStep[];
  task: string;
}

export function StepsOverlay({
  open,
  onOpenChange,
  steps,
  task,
}: StepsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0A0A0A] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Agent Execution Steps
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Task: {task}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 mt-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} isLast={index === steps.length - 1} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepCard({ step, isLast }: { step: DetailedStep; isLast: boolean }) {
  // Extract different content types
  const toolCalls = step.content.filter((item) => item.type === "tool-call");
  const toolResults = step.content.filter((item) => item.type === "tool-result");
  const textItems = step.content.filter((item) => item.type === "text");

  const hasToolCalls = toolCalls.length > 0;
  const hasText = textItems.length > 0;

  // Determine overall step status
  const allSuccessful =
    toolResults.length === 0 ||
    toolResults.every((r) => r.success !== false);

  // Group tool calls with their matching results
  const toolExecutions = toolCalls.map((tc) => {
    const matchingResult = toolResults.find(
      (tr) => tr.toolCallId === tc.toolCallId
    );
    return {
      toolCall: tc,
      toolResult: matchingResult,
    };
  });

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-px bg-white/10" />
      )}

      <div className="flex gap-4">
        {/* Step number circle */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            allSuccessful
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {step.stepNumber}
        </div>

        {/* Step content */}
        <div className="flex-1 space-y-3 pb-4">
          {/* Step header */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-white/20 text-gray-300"
            >
              Step {step.stepNumber}
            </Badge>
            {step.finishReason && (
              <Badge
                variant="outline"
                className="border-white/10 text-gray-500 text-xs"
              >
                {step.finishReason}
              </Badge>
            )}
            {hasToolCalls && (
              <Badge
                variant="secondary"
                className="bg-purple-500/20 text-purple-300 border-purple-500/30"
              >
                <Terminal className="w-3 h-3 mr-1" />
                {toolCalls.length} execution{toolCalls.length > 1 ? "s" : ""}
              </Badge>
            )}
            {allSuccessful ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* Tool executions - show code and results together */}
          {toolExecutions.map((execution, execIndex) => (
            <div
              key={execIndex}
              className="space-y-3"
            >
              {/* Generated Code Section */}
              {execution.toolCall.code && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors w-full">
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span>Generated Playwright Code</span>
                    {execution.toolCall.toolName && (
                      <span className="text-xs text-gray-500 font-mono ml-auto">
                        {execution.toolCall.toolName}
                      </span>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-[#1a1a2e] rounded-lg border border-purple-500/20 overflow-hidden">
                      <div className="bg-purple-500/10 px-3 py-1.5 border-b border-purple-500/20 flex items-center gap-2">
                        <Code2 className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-300 font-medium">
                          AI Generated Code
                        </span>
                      </div>
                      <pre className="p-3 text-sm font-mono text-gray-200 overflow-x-auto whitespace-pre-wrap">
                        {execution.toolCall.code}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

            </div>
          ))}

          {/* Agent text response */}
          {hasText && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <MessageSquare className="w-3 h-3" />
                Agent Response
              </div>
              {textItems.map((item, textIndex) => (
                <p
                  key={textIndex}
                  className="text-sm text-gray-200 whitespace-pre-wrap"
                >
                  {item.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
