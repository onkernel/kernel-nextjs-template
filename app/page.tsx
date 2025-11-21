"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface BrowserSession {
  sessionId: string;
  liveViewUrl: string;
  cdpWsUrl: string;
  spinUpTime: number;
}

interface ExecutedCode {
  code: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface AutomationResult {
  success: boolean;
  response?: string;
  executedCodes?: ExecutedCode[];
  stepCount?: number;
  timestamp: number;
  error?: string;
  task?: string;
}

export default function HomePage() {
  const [creatingBrowser, setCreatingBrowser] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [closingBrowser, setClosingBrowser] = useState(false);
  const [browserSession, setBrowserSession] = useState<BrowserSession | null>(
    null
  );
  const [automationResults, setAutomationResults] = useState<
    AutomationResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [task, setTask] = useState("Navigate to https://onkernel.com and get the page title");

  const createBrowser = async () => {
    setCreatingBrowser(true);
    setError(null);
    setDeployUrl(null);

    try {
      const response = await fetch("/api/create-browser", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setBrowserSession({
          sessionId: data.sessionId,
          liveViewUrl: data.liveViewUrl,
          cdpWsUrl: data.cdpWsUrl,
          spinUpTime: data.spinUpTime,
        });
      } else {
        if (data.error === "MISSING_API_KEY" && data.deployUrl) {
          setDeployUrl(data.deployUrl);
        }
        setError(data.message || data.error || "Failed to create browser");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to API"
      );
    } finally {
      setCreatingBrowser(false);
    }
  };

  const runAutomation = async () => {
    if (!browserSession || !task.trim()) return;

    setRunningAutomation(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: browserSession.sessionId,
          task: task.trim(),
        }),
      });

      const data = await response.json();

      const result: AutomationResult = {
        success: data.success,
        response: data.response,
        executedCodes: data.executedCodes,
        stepCount: data.stepCount,
        error: data.error,
        task: task.trim(),
        timestamp: Date.now(),
      };

      setAutomationResults((prev) => [result, ...prev]);

      // Clear the task input after successful execution
      if (data.success) {
        setTask("");
      }
    } catch (err) {
      const result: AutomationResult = {
        success: false,
        error: "Failed to run AI agent",
        task: task.trim(),
        timestamp: Date.now(),
      };
      setAutomationResults((prev) => [result, ...prev]);
    } finally {
      setRunningAutomation(false);
    }
  };

  const closeBrowser = async () => {
    if (!browserSession) return;

    setClosingBrowser(true);

    try {
      const response = await fetch("/api/delete-browser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: browserSession.sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear browser session and reset state
        setBrowserSession(null);
        setAutomationResults([]);
        setTask("Navigate to https://onkernel.com and get the page title");
      } else {
        setError(data.error || "Failed to close browser");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to close browser"
      );
    } finally {
      setClosingBrowser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/kernel-logo.svg"
              alt="Kernel"
              width={120}
              height={23}
              priority
            />
            <span className="text-xl text-muted-foreground">X</span>
            <Image
              src="/vercel-logo.svg"
              alt="Vercel"
              width={120}
              height={23}
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-center">
            {/* Hero Section */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-balance">
                AI-Powered Browser Automation with Kernel
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                Describe what you want to do in natural language, and watch as an AI agent writes and executes Playwright code in real-time.
              </p>
            </div>

            {/* Step 1: Create Browser */}
            {!browserSession && (
              <div>
                <Button
                  size="lg"
                  onClick={createBrowser}
                  disabled={creatingBrowser}
                  className="text-lg px-8 py-6"
                >
                  {creatingBrowser ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Browser...
                    </>
                  ) : (
                    "Create Browser"
                  )}
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && !browserSession && (
              <Card className="text-left">
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="font-mono text-sm text-red-600">{error}</p>
                    {deployUrl && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          Deploy this template with the Kernel integration to get started:
                        </p>
                        <a
                          href={deployUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src="https://vercel.com/button"
                            alt="Deploy with Vercel"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live View and Automation Controls */}
            {browserSession && (
              <div className="space-y-6">
                {/* Live View */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">Browser Live View</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={closeBrowser}
                          disabled={closingBrowser || runningAutomation}
                        >
                          {closingBrowser ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Closing...
                            </>
                          ) : (
                            "Close Browser"
                          )}
                        </Button>
                      </div>
                      <div className="rounded-lg overflow-hidden border bg-black h-[500px]">
                        <iframe
                          src={browserSession.liveViewUrl}
                          className="w-full h-full"
                          allow="camera; microphone; display-capture"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-left text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Browser Spin-Up Time
                          </p>
                          <p className="font-mono font-semibold">
                            {browserSession.spinUpTime}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Session ID</p>
                          <p className="font-mono font-semibold">
                            {browserSession.sessionId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Run AI Agent */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2 text-left">
                        <label
                          htmlFor="task-input"
                          className="text-sm font-medium"
                        >
                          Describe what you want the browser to do
                        </label>
                        <Textarea
                          id="task-input"
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                          placeholder="Navigate to https://onkernel.com and click the Docs link"
                          disabled={runningAutomation}
                          className="min-h-[100px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              runAutomation();
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Press Cmd/Ctrl + Enter to run
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={runAutomation}
                        disabled={runningAutomation || !task.trim()}
                        className="w-full text-lg py-6"
                      >
                        {runningAutomation ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            AI Agent Running...
                          </>
                        ) : (
                          "Run AI Agent"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Automation Results */}
                {automationResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-left">
                      Agent Results
                    </h3>
                    {automationResults.map((result, index) => (
                      <Card key={result.timestamp} className="text-left">
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold">
                                      Run #{automationResults.length - index}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold">
                                      Run #{automationResults.length - index}{" "}
                                      Failed
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            {/* Task Description */}
                            {result.task && (
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm text-muted-foreground mb-1">
                                  Task:
                                </p>
                                <p className="text-sm">{result.task}</p>
                              </div>
                            )}

                            {result.success ? (
                              <div className="space-y-3">
                                {/* Agent Response */}
                                {result.response && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                      Response:
                                    </p>
                                    <p className="text-sm">{result.response}</p>
                                  </div>
                                )}

                                {/* Step Count */}
                                {result.stepCount !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {result.stepCount} steps
                                    </Badge>
                                  </div>
                                )}

                                {/* Executed Code Collapsible */}
                                {result.executedCodes && result.executedCodes.length > 0 && (
                                  <Collapsible>
                                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                                      <ChevronDown className="w-4 h-4" />
                                      View Generated Playwright Code ({result.executedCodes.length} {result.executedCodes.length === 1 ? 'execution' : 'executions'})
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-3 space-y-3">
                                      {result.executedCodes.map((code, codeIndex) => (
                                        <div key={codeIndex} className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant={code.success ? "default" : "destructive"}>
                                              Execution {codeIndex + 1}
                                            </Badge>
                                            {code.success ? (
                                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                                            ) : (
                                              <XCircle className="w-3 h-3 text-red-600" />
                                            )}
                                          </div>
                                          <pre className="p-3 bg-muted rounded-md overflow-x-auto text-xs font-mono">
                                            {code.code}
                                          </pre>
                                          {code.result !== undefined && (
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">
                                                Result:
                                              </p>
                                              <pre className="p-2 bg-muted rounded-md overflow-x-auto text-xs font-mono">
                                                {typeof code.result === 'object'
                                                  ? JSON.stringify(code.result, null, 2)
                                                  : String(code.result)}
                                              </pre>
                                            </div>
                                          )}
                                          {code.error && (
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">
                                                Error:
                                              </p>
                                              <p className="text-xs text-red-600 font-mono">
                                                {code.error}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    Error:
                                  </span>
                                  <p className="font-mono text-sm text-red-600">
                                    {result.error}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">1.</div>
                    <h3 className="font-semibold">Create Browser</h3>
                    <p className="text-sm text-muted-foreground">
                      Kernel provisions a cloud browser instance in 300ms
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">2.</div>
                    <h3 className="font-semibold">Describe Your Task</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell the browser agent what you want to do in natural language
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">3.</div>
                    <h3 className="font-semibold">Watch It Execute</h3>
                    <p className="text-sm text-muted-foreground">
                      AI generates and runs Playwright code in real-time
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            Powered by{" "}
            <a
              href="https://onkernel.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kernel
            </a>
            ,{" "}
            <a
              href="https://vercel.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>
            , and{" "}
            <a
              href="https://openai.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GPT-5
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
