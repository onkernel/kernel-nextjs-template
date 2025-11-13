"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Clock, Activity, Eye, EyeOff, Puzzle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface BrowserSession {
  sessionId: string;
  liveViewUrl: string;
  cdpWsUrl: string;
  spinUpTime: number;
}

interface DualBrowserSession {
  browserA: BrowserSession;
  browserB: BrowserSession;
  extensionId: string;
  extensionName: string;
}

interface MagnitudeAutomationResult {
  success: boolean;
  executionTime: number;
  result: string;
  error?: string;
}

interface DualAutomationResult {
  browserA: MagnitudeAutomationResult;
  browserB: MagnitudeAutomationResult;
  timestamp: number;
  taskDescription: string;
  targetWebsite: string;
  modelUsed: string;
}

interface Extension {
  id: string;
  name: string;
}

export default function HomePage() {
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);

  const [creatingBrowser, setCreatingBrowser] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [browserSession, setBrowserSession] = useState<DualBrowserSession | null>(null);
  const [automationResults, setAutomationResults] = useState<DualAutomationResult[]>([]);
  const [currentResultA, setCurrentResultA] = useState<MagnitudeAutomationResult | null>(null);
  const [currentResultB, setCurrentResultB] = useState<MagnitudeAutomationResult | null>(null);
  const [runningA, setRunningA] = useState(false);
  const [runningB, setRunningB] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("https://www.onkernel.com/docs/careers/intro");
  const [taskDescription, setTaskDescription] = useState("Tell me what Kernel is looking for in a Customer Engineer.");
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5-20250929");
  const [showBrowserA, setShowBrowserA] = useState(true);
  const [showBrowserB, setShowBrowserB] = useState(true);

  // Helper function to format execution time
  const formatExecutionTime = (ms: number): string => {
    if (ms > 10000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  // Load extensions on mount
  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    setLoadingExtensions(true);
    try {
      const response = await fetch("/api/list-extensions");
      const data = await response.json();

      if (data.extensions) {
        setExtensions(data.extensions);
        if (data.extensions.length > 0) {
          setSelectedExtension(data.extensions[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load extensions:", err);
    } finally {
      setLoadingExtensions(false);
    }
  };

  const createBrowser = async () => {
    setCreatingBrowser(true);
    setError(null);
    setDeployUrl(null);

    try {
      const response = await fetch("/api/create-browser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extensionId: selectedExtension?.id || null,
          extensionName: selectedExtension?.name || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBrowserSession({
          browserA: data.browserA,
          browserB: data.browserB,
          extensionId: data.extensionId,
          extensionName: data.extensionName,
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
    if (!browserSession) return;

    setRunningAutomation(true);
    setRunningA(true);
    setRunningB(true);
    setCurrentResultA(null);
    setCurrentResultB(null);

    // Store results as they come in
    let resultA: MagnitudeAutomationResult | null = null;
    let resultB: MagnitudeAutomationResult | null = null;

    // Run both automations and update results independently as they complete
    const runBrowserA = async () => {
      try {
        const response = await fetch("/api/run-automation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cdpWsUrl: browserSession.browserA.cdpWsUrl,
            url: targetUrl,
            task: taskDescription,
            model: selectedModel,
          }),
        });

        const data = await response.json();
        if (data.success) {
          resultA = data;
          setCurrentResultA(data);
        }
      } catch (err) {
        console.error("Browser A automation failed:", err);
      } finally {
        setRunningA(false);
      }
    };

    const runBrowserB = async () => {
      try {
        const response = await fetch("/api/run-automation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cdpWsUrl: browserSession.browserB.cdpWsUrl,
            url: targetUrl,
            task: taskDescription,
            model: selectedModel,
          }),
        });

        const data = await response.json();
        if (data.success) {
          resultB = data;
          setCurrentResultB(data);
        }
      } catch (err) {
        console.error("Browser B automation failed:", err);
      } finally {
        setRunningB(false);
      }
    };

    // Start both automations and wait for completion (results update progressively)
    await Promise.all([runBrowserA(), runBrowserB()]);

    // After both complete, add to history
    if (resultA && resultB) {
      const result: DualAutomationResult = {
        browserA: resultA,
        browserB: resultB,
        timestamp: Date.now(),
        taskDescription: taskDescription,
        targetWebsite: targetUrl,
        modelUsed: selectedModel,
      };
      setAutomationResults((prev) => [result, ...prev]);
    }

    setRunningAutomation(false);
  };

  const resetBrowsers = async () => {
    if (!browserSession) return;

    try {
      // Call delete API to cleanup Kernel browsers
      await fetch("/api/delete-browsers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionIdA: browserSession.browserA.sessionId,
          sessionIdB: browserSession.browserB.sessionId,
        }),
      });
    } catch (err) {
      console.error("Error deleting browsers:", err);
    } finally {
      // Clear state regardless of API success
      setBrowserSession(null);
      setAutomationResults([]);
      setCurrentResultA(null);
      setCurrentResultB(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-b from-muted/30 to-background backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Puzzle className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Test Extensions with Browser Automation
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Compare browser automation with and without your Chrome extension to see how it enhances your automation capabilities
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-8">
            {/* Step 1: Select Extension and Create Browsers */}
            {!browserSession && (
              <div className="space-y-6 max-w-2xl mx-auto">
                {/* Extension Selection */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2 text-left">
                        <label htmlFor="extension-select" className="text-sm font-medium">
                          Load Chrome Extension
                        </label>
                        {loadingExtensions ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading extensions...</span>
                          </div>
                        ) : extensions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No extensions found. Upload an extension to your Kernel account first.
                          </p>
                        ) : (
                          <select
                            id="extension-select"
                            value={selectedExtension?.id || ""}
                            onChange={(e) => {
                              const ext = extensions.find((ex) => ex.id === e.target.value);
                              setSelectedExtension(ext || null);
                            }}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          >
                            {extensions.map((ext) => (
                              <option key={ext.id} value={ext.id}>
                                {ext.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={createBrowser}
                    disabled={creatingBrowser || !selectedExtension}
                    className="text-lg px-8 py-6"
                  >
                    {creatingBrowser ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Browsers...
                      </>
                    ) : (
                      "Create Browsers"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && !browserSession && (
              <Card className="text-left max-w-2xl mx-auto">
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

            {/* Dual Browser Live Views and Automation Controls */}
            {browserSession && (
              <div className="space-y-6">
                {/* Browser Visibility Controls */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    variant={showBrowserA ? "default" : "outline"}
                    onClick={() => setShowBrowserA(!showBrowserA)}
                    size="sm"
                  >
                    {showBrowserA ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    Browser A
                  </Button>
                  <Button
                    variant={showBrowserB ? "default" : "outline"}
                    onClick={() => setShowBrowserB(!showBrowserB)}
                    size="sm"
                  >
                    {showBrowserB ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    Browser B
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={resetBrowsers}
                    size="sm"
                  >
                    Reset Browsers
                  </Button>
                </div>

                {/* Side-by-Side Live Views */}
                <div className={`grid gap-6 ${
                  showBrowserA && showBrowserB ? 'md:grid-cols-2' : 'md:grid-cols-1'
                }`}>
                  {/* Browser A */}
                  {showBrowserA && (
                  <Card>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">Browser A</span>
                        </div>
                        <div className={`relative rounded-lg overflow-hidden border bg-black ${showBrowserA && showBrowserB ? 'h-[400px]' : 'h-[600px]'}`}>
                          <iframe
                            src={browserSession.browserA.liveViewUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="camera; microphone; display-capture"
                            title="Browser A Live View"
                          />
                        </div>
                        <div className="text-left text-sm space-y-2">
                          <div>
                            <p className="text-muted-foreground">Browser Spin-Up Time</p>
                            <p className="font-mono font-semibold">
                              {browserSession.browserA.spinUpTime}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Session ID</p>
                            <p className="font-mono text-xs">
                              {browserSession.browserA.sessionId}
                            </p>
                          </div>
                        </div>

                        {/* Live Result Display for Browser A */}
                        {(runningA || currentResultA) && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                            <div className="flex items-center gap-2">
                              {runningA ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : currentResultA?.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="font-medium text-sm">
                                {runningA ? "Running..." : "Latest Result"}
                              </span>
                            </div>

                            {currentResultA && !runningA && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Execution Time:
                                    </span>
                                    <p className="font-mono text-sm font-bold">
                                      {formatExecutionTime(currentResultA.executionTime)}
                                    </p>
                                  </div>
                                </div>

                                {currentResultA.success ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground font-semibold">
                                        Result:
                                      </span>
                                      <p className="text-sm mt-1">
                                        {currentResultA.result}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Error:
                                    </span>
                                    <p className="text-sm text-red-600 mt-1">
                                      {currentResultA.error}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {/* Browser B (with Extension) */}
                  {showBrowserB && (
                  <Card>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">
                            Browser B (w/ Ext: {browserSession.extensionName})
                          </span>
                        </div>
                        <div className={`relative rounded-lg overflow-hidden border bg-black ${showBrowserA && showBrowserB ? 'h-[400px]' : 'h-[600px]'}`}>
                          <iframe
                            src={browserSession.browserB.liveViewUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="camera; microphone; display-capture"
                            title="Browser B Live View"
                          />
                        </div>
                        <div className="text-left text-sm space-y-2">
                          <div>
                            <p className="text-muted-foreground">Browser Spin-Up Time</p>
                            <p className="font-mono font-semibold">
                              {browserSession.browserB.spinUpTime}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Session ID</p>
                            <p className="font-mono text-xs">
                              {browserSession.browserB.sessionId}
                            </p>
                          </div>
                        </div>

                        {/* Live Result Display for Browser B */}
                        {(runningB || currentResultB) && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                            <div className="flex items-center gap-2">
                              {runningB ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : currentResultB?.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="font-medium text-sm">
                                {runningB ? "Running..." : "Latest Result"}
                              </span>
                            </div>

                            {currentResultB && !runningB && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Execution Time:
                                    </span>
                                    <p className="font-mono text-sm font-bold">
                                      {formatExecutionTime(currentResultB.executionTime)}
                                    </p>
                                  </div>
                                </div>

                                {currentResultB.success ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground font-semibold">
                                        Result:
                                      </span>
                                      <p className="text-sm mt-1">
                                        {currentResultB.result}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Error:
                                    </span>
                                    <p className="text-sm text-red-600 mt-1">
                                      {currentResultB.error}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  )}
                </div>

                {/* Automation Controls */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-left">Run AI-Powered Automation</h3>

                      <div className="space-y-2 text-left">
                        <label htmlFor="target-url" className="text-sm font-medium">
                          Target Website
                        </label>
                        <Input
                          id="target-url"
                          type="url"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          placeholder="https://onkernel.com"
                          disabled={runningAutomation}
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label htmlFor="task-description" className="text-sm font-medium">
                          Task Description
                        </label>
                        <textarea
                          id="task-description"
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="Go to the developer documentation and summarize the job opportunities available at Kernel"
                          disabled={runningAutomation}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          Describe what you want the AI agent to do on both browsers
                        </p>
                      </div>

                      <div className="space-y-2 text-left">
                        <label htmlFor="model-select" className="text-sm font-medium">
                          AI Model
                        </label>
                        <select
                          id="model-select"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          disabled={runningAutomation}
                          className="w-full px-3 py-2 border rounded-md bg-background"
                        >
                          <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 ($$)</option>
                          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 ($)</option>
                        </select>
                      </div>

                      <Button
                        size="lg"
                        onClick={runAutomation}
                        disabled={runningAutomation}
                        className="w-full text-lg py-6"
                      >
                        {runningAutomation ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Running Automation on Both Browsers...
                          </>
                        ) : (
                          "Run Automation"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Automation Results */}
                {automationResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-left">
                      Automation Results
                    </h3>
                    {automationResults.map((result, index) => (
                      <Card key={result.timestamp} className="text-left">
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                Task #{automationResults.length - index}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            {/* Task Metadata */}
                            <div className="space-y-2 text-sm border-b pb-3">
                              <div>
                                <span className="text-muted-foreground font-medium">Task Requested: </span>
                                <span>{result.taskDescription}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Target Website: </span>
                                <span className="text-primary">{result.targetWebsite}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Model Used: </span>
                                <span>
                                  {result.modelUsed === "claude-sonnet-4-5-20250929"
                                    ? "Claude Sonnet 4.5 ($$)"
                                    : "Claude Haiku 4.5 ($)"}
                                </span>
                              </div>
                            </div>

                            {/* Side by Side Results */}
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* Browser A Results */}
                              <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  {result.browserA.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="font-medium text-sm">Browser A</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Execution Time:
                                    </span>
                                    <p className="font-mono text-lg font-bold">
                                      {formatExecutionTime(result.browserA.executionTime)}
                                    </p>
                                  </div>
                                </div>

                                {result.browserA.success ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground font-semibold">
                                        Result:
                                      </span>
                                      <p className="text-sm mt-1">
                                        {result.browserA.result}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Error:
                                    </span>
                                    <p className="text-sm text-red-600 mt-1">
                                      {result.browserA.error}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Browser B Results */}
                              <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  {result.browserB.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="font-medium text-sm">
                                    Browser B (w/ Ext)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Execution Time:
                                    </span>
                                    <p className="font-mono text-lg font-bold">
                                      {formatExecutionTime(result.browserB.executionTime)}
                                    </p>
                                  </div>
                                </div>

                                {result.browserB.success ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground font-semibold">
                                        Result:
                                      </span>
                                      <p className="text-sm mt-1">
                                        {result.browserB.result}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Error:
                                    </span>
                                    <p className="text-sm text-red-600 mt-1">
                                      {result.browserB.error}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
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
                    <h3 className="font-semibold">Select Extension</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a Chrome extension <Link className="underline" href="https://www.onkernel.com/docs/browsers/extensions#uploading-extensions">uploaded</Link> to your Kernel account.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">2.</div>
                    <h3 className="font-semibold">Create Dual Browsers</h3>
                    <p className="text-sm text-muted-foreground">
                      Kernel spins up two identical browsers - one with your extension, one without it.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">3.</div>
                    <h3 className="font-semibold">Run AI Automation</h3>
                    <p className="text-sm text-muted-foreground">
                      Use <Link className="underline" href="https://docs.magnitude.run">the Magnitude SDK</Link> to execute natural language tasks and compare results
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
              href="https://docs.magnitude.run"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Magnitude
            </a>
            , and{" "}
            <a
              href="https://vercel.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
