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
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown, Monitor, Terminal, Zap } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";

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
    <div className="min-h-screen relative flex flex-col">
      {/* Radial Glow Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Main Content */}
      <section className="py-12 lg:py-20 relative z-10 flex-grow">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-center">
            {/* Hero Section */}
            <div className="space-y-4">
              <h2 className="text-6xl lg:text-7xl font-bold text-balance bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                AI-Powered Browser Automation with Kernel
              </h2>
              <p className="text-lg text-gray-400 text-balance">
                Describe what you want to do in natural language, and watch as an AI agent writes and executes Playwright code in real-time.
              </p>
            </div>

            {/* Step 1: Create Browser */}
            {!browserSession && (
              <div className="space-y-2">
                <Button
                  variant="vercel"
                  size="lg"
                  onClick={createBrowser}
                  disabled={creatingBrowser}
                  className="text-base px-8 py-6 h-auto font-semibold"
                >
                  {creatingBrowser ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Browser...
                    </>
                  ) : (
                    <>
                      Create Browser
                      <span className="ml-1">→</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600">Click to create cloud browser</p>
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

            {/* Info Cards - Bento Grid */}
            <div className="grid md:grid-cols-3 gap-6 pt-8 md:items-center">
              {/* Card 1 - Create Browser */}
              <Card className="bg-[#0A0A0A] border-white/5 relative overflow-hidden">
                <CardContent className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                      <Monitor className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-7xl font-bold text-white/10">01</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Create Browser</h3>
                    <p className="text-sm text-gray-500">
                      Kernel provisions a secure cloud browser instance in &lt;300ms. Fully isolated and scalable.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - Describe Your Task (Middle - Purple Accent) */}
              <Card className="bg-[#0A0A0A] border-white/5 relative overflow-hidden md:h-[17rem]">
                <CardContent className="relative h-full py-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <Terminal className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-7xl font-bold text-purple-500/10">02</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Describe Your Task</h3>
                    <p className="text-sm text-gray-400">
                      Tell the browser agent what you want to do in natural language. Turn intent to action with AI SDK.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Watch It Execute */}
              <Card className="bg-[#0A0A0A] border-white/5 relative overflow-hidden">
                <CardContent className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                      <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-7xl font-bold text-white/10">03</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Watch it Execute</h3>
                    <p className="text-sm text-gray-500">
                      Agent generates and then executes code in real time using Kernel's Playwright Execution API.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600 text-xs">
          <p>
            Powered by{" "}
            <a
              href="https://onkernel.com"
              className="font-medium hover:text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kernel
            </a>
            ,{" "}
            <a
              href="https://vercel.com"
              className="font-medium hover:text-gray-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>
            , and{" "}
            <a
              href="https://openai.com"
              className="font-medium hover:text-gray-400 transition-colors"
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
