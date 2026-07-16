import React, { useState, useEffect } from "react";
import {
  Clock,
  Database,
  GitBranch,
  Sparkles,
  Terminal,
  Network,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  Send,
  HelpCircle,
  Cpu,
  Layers,
  Settings2,
  BookOpen
} from "lucide-react";

// Types
import { Scenario, WorkflowEvent, KnowledgeGraphNode, KnowledgeGraphEdge, ModularConnector, PipelineStage } from "./types";

// Static preset datasets
import {
  PRESET_SCENARIOS,
  WORKFLOW_EVENTS,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_EDGES,
  MODULAR_CONNECTORS
} from "./data/presetData";

// Sub-components
import PipelineWorkflow from "./components/PipelineWorkflow";
import KnowledgeGraphView from "./components/KnowledgeGraphView";
import InteractiveTimeline from "./components/InteractiveTimeline";
import ConnectorIntegrations from "./components/ConnectorIntegrations";

export default function App() {
  const [serverHealth, setServerHealth] = useState<"checking" | "online" | "offline">("checking");
  const [apiKeyActive, setApiKeyActive] = useState<boolean>(false);
  const [showKeyWarning, setShowKeyWarning] = useState<boolean>(false);

  // Active view tabs: "timeline" (Forensic Time Machine) | "graph" (Semantic Graph) | "connectors" (Modular Connectors)
  const [activeTab, setActiveTab] = useState<"timeline" | "graph" | "connectors">("timeline");

  // Selection states
  const [scenarios] = useState<Scenario[]>(PRESET_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("redis-incident");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Custom User query states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [matchingEntities, setMatchingEntities] = useState<string[]>([]);

  // Pipeline stages progress state
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: "ingestion", name: "GitHub Ingestion", description: "Fetch issues/PRs/commits", status: "idle" },
    { id: "extraction", name: "Event Extraction", description: "Parse NLP structures", status: "idle" },
    { id: "graph", name: "Knowledge Graph", description: "Solder nodes & relations", status: "idle" },
    { id: "vector", name: "Vector Indexing", description: "Embed semantic context", status: "idle" },
    { id: "timeline", name: "Timeline Splice", description: "Reconstruct incident flow", status: "idle" },
    { id: "llm", name: "AI Synthesis", description: "Formulate analytical summary", status: "idle" }
  ]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Modular connectors state
  const [connectors, setConnectors] = useState<ModularConnector[]>(MODULAR_CONNECTORS);

  // Check health on load
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setServerHealth("online");
          setApiKeyActive(data.hasApiKey);
          if (!data.hasApiKey) {
            setShowKeyWarning(true);
          }
        } else {
          setServerHealth("offline");
        }
      } catch (err) {
        console.error("Backend health check failed:", err);
        setServerHealth("offline");
      }
    }
    checkHealth();
  }, []);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const scenarioEvents = WORKFLOW_EVENTS[selectedScenarioId] || [];
  const scenarioNodes = KNOWLEDGE_GRAPH_NODES[selectedScenarioId] || [];
  const scenarioEdges = KNOWLEDGE_GRAPH_EDGES[selectedScenarioId] || [];

  // Default select first event when scenario changes
  useEffect(() => {
    if (scenarioEvents.length > 0) {
      setSelectedEventId(scenarioEvents[0].id);
    }
    if (scenarioNodes.length > 0) {
      setSelectedNodeId(scenarioNodes[0].id);
    }
    setAiAnswer(null);
    setSearchQuery("");
    setMatchingEntities([]);
    resetPipeline();
  }, [selectedScenarioId]);

  const resetPipeline = () => {
    setPipelineStages((prev) =>
      prev.map((s) => ({ ...s, status: "idle", metrics: undefined }))
    );
    setActiveStageId(null);
    setIsReconstructing(false);
  };

  const handleToggleConnector = (connectorId: string, fields: Record<string, string>) => {
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.id === connectorId) {
          const isEnabling = c.status !== "connected";
          return {
            ...c,
            status: isEnabling ? "connected" : "disconnected",
            lastSync: isEnabling ? new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC" : undefined,
            ingestedCount: isEnabling ? 452 : 0,
            webhookUrl: isEnabling ? `https://time-machine.api.io/webhooks/${c.id}` : undefined
          };
        }
        return c;
      })
    );
  };

  // Perform forensic reconstruction
  const runReconstruction = async (queryText: string) => {
    if (!queryText.trim() || isReconstructing) return;

    setIsReconstructing(true);
    setSearchQuery(queryText);
    setAiAnswer(null);

    // Animate stages step-by-step
    const stagesList: PipelineStage["id"][] = ["ingestion", "extraction", "graph", "vector", "timeline", "llm"];
    
    for (let i = 0; i < stagesList.length; i++) {
      const stageId = stagesList[i];
      setActiveStageId(stageId);
      
      setPipelineStages((prev) =>
        prev.map((s) => {
          if (s.id === stageId) {
            return { ...s, status: "running" };
          }
          return s;
        })
      );

      // Sleep to simulate rapid pipeline parsing
      await new Promise((resolve) => setTimeout(resolve, 350));

      setPipelineStages((prev) =>
        prev.map((s) => {
          if (s.id === stageId) {
            let metrics = "OK";
            if (stageId === "ingestion") metrics = `${scenarioEvents.length} events loaded`;
            if (stageId === "extraction") metrics = `${scenarioEvents.reduce((acc, curr) => acc + curr.entities.length, 0)} nodes extracted`;
            if (stageId === "graph") metrics = `${scenarioNodes.length} nodes connected`;
            if (stageId === "vector") metrics = "12 text chunks indexed";
            if (stageId === "timeline") metrics = "Chronology locked";
            if (stageId === "llm") metrics = "Report generated";

            return { ...s, status: "success", metrics };
          }
          return s;
        })
      );
    }

    setActiveStageId(null);

    // Highlight matching entities based on simple keyword intersections to make graph glow!
    const queryLower = queryText.toLowerCase();
    const matched = scenarioEvents
      .flatMap((e) => e.entities)
      .filter((ent) => queryLower.includes(ent.toLowerCase()) || ent.toLowerCase().includes(queryLower));
    setMatchingEntities(Array.from(new Set(matched)));

    // Try requesting actual Gemini AI models
    try {
      const systemInstruction = `
You are the Knowledge Time Machine forensic AI analyzer.
You help engineering teams understand "WHY" code changed rather than only "WHAT" changed.
Below are the chronological Git/GitHub repository event files parsed for this scenario:
${JSON.stringify(scenarioEvents, null, 2)}

Provide a highly professional, scannable, Linear/Vercel-style technical audit report answering the user's specific query.
Focus on:
1. Identifying who introduced the changes, when, and under what issues or PR numbers.
2. Explaining the underlying engineering reason/justification (the "Why").
3. Breaking down any architectural side effects, test alerts, or cost budget impacts.
4. Structuring your response with elegant markdown, emphasizing file diff blocks or lines where appropriate. Do not use generic answers; cite actual hashes and author names.
`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `USER QUERY: ${queryText}\nSCENARIO NAME: ${currentScenario.name}`,
          systemInstruction,
          model: "gemini-3.5-flash",
          temperature: 0.15
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnswer(data.text);
      } else {
        throw new Error("Gemini endpoint bypassed or returned non-ok status");
      }
    } catch (err) {
      console.warn("Falling back to local forensic model:", err);
      // Fallback local robust grounding text
      generateLocalFallbackAnswer(queryText);
    } finally {
      setIsReconstructing(false);
    }
  };

  const generateLocalFallbackAnswer = (query: string) => {
    const qLower = query.toLowerCase();
    if (selectedScenarioId === "redis-incident") {
      if (qLower.includes("redis") || qLower.includes("remove") || qLower.includes("why")) {
        setAiAnswer(`### 🔍 Redis Removal Incident Report

**1. Root Cause Analysis**
Redis was removed in commit **7b8e1a2** by **bob_ops** under **PR #405** to reduce staging infrastructure budget fees (saving $120/month per staging environment sandbox) following the resource constraints raised in **Issue #101**.

**2. The Regression Mechanism**
Bob replaced the robust Redis remote cache server with an unbound global JavaScript Object dictionary cache (\`localCache = {}\`) inside \`src/services/cache.js\`. Because this dictionary lacked a Time-To-Live (TTL) or eviction strategy, active sessions grew indefinitely.

**3. CI Pipeline Alert & Resolution**
- **Trigger**: The longevity traffic simulator (**Build #902**) crashed with a JavaScript heap out of memory after 2 hours of processing 15,000 auth tokens.
- **Resolution**: **charlie_arch** committed a hotfix (**fa9c12a**) wrapping the dictionary with a bounded \`LRUCache\` configured to a maximum of 1,000 items with a 15-minute expiration period.

**Suggested Mitigation**: Never use unevictable global objects for active request sessions. Ensure all staging fallbacks utilize containerized Redis replicas or strictly bounded caches.`);
      } else {
        setAiAnswer(`### 🔍 General Forensic Summary: Redis Incident
The timeline reveals that staging downscaling optimization led to removing the containerized Redis cluster. The resulting fallback memory cache memory leak was flagged by **alice_dev** on code review but dismissed, resulting in an OOM container failure under test load. Resolved via a bounded LRU policy by **charlie_arch** in **fa9c12a**.`);
      }
    } else if (selectedScenarioId === "auth-bypass") {
      if (qLower.includes("bug") || qLower.includes("who") || qLower.includes("bypass")) {
        setAiAnswer(`### 🔒 Cryptographic Auth Bypass Incident Report

**1. Who Introduced the Vulnerability?**
The bypass backdoor was committed by **bob_ops** in **Commit db01a2f**. 
- **The Code**: Bob added a raw check allowing any client token matching \`test-override\` or starting with \`md5-\` to gain complete root admin privileges without secret-key decryption.

**2. Why was Security Ignored?**
The bypass was created to resolve **Issue #202** (Vite development sandboxes experiencing 300ms JWT decryption latency). 
- **The Override**: The CodeQL static security analyzer correctly flagged the backdoor as a Critical Security Vulnerability in **Build #945**. However, **dave_manager** manually bypassed the warning and merged **PR #411** to ensure a vital board meeting demo remained green.

**3. Remediation**
On July 4th, **alice_dev** discovered the active backdoor in production packages and reverted the backdoor check in **Commit 9c2041e**, restoring secure HMAC signature validation.`);
      } else {
        setAiAnswer(`### 🔍 General Forensic Summary: Auth Bypass
A development backdoor committed by **bob_ops** was administrative-merged into main by **dave_manager** to unlock the staging pipelines for a demo. This bypassed a critical CodeQL scan. Corrected by **alice_dev** in **9c2041e**.`);
      }
    } else {
      // S3 sync
      setAiAnswer(`### 📂 S3 Storage Sync Cleanup Incident Report

**1. Why was the function deleted?**
The helper function \`pruneStaleS3Backups()\` was deleted in commit **1f4e5a9** by **bob_ops** during a general house-cleaning task requested by **dave_manager** (**Issue #315**). Because the file had no explicit static imports inside the main Node bundle, Bob assumed it was obsolete code.

**2. The Unintended Side-Effects**
The cleanup routine was actually invoked externally by an AWS Lambda cron job container using dynamic Node execution:
\`node -e "require('./src/services/storage_sync_cleanup_service').pruneStaleS3Backups()"\`

**3. Operational Consequences**
- After the deletion merged under **PR #320**, the Lambda cron job crashed daily with \`Cannot find module\` errors (**Build #1004**).
- For 10 days, temporary diagnostic zip archives accumulated on AWS S3, ballooning the storage to 14.5TB and triggering a budget alarm spike of 450%.

**Aesthetic Resolution**: Restore the isolated service code immediately and introduce automated integration tests checking external trigger dependency imports.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white" id="time-machine-cockpit">
      
      {/* Top Professional Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Clock className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-100">Knowledge Time Machine</h1>
              <span className="text-[9px] font-mono bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                FORENSIC ENGINE v1.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Chronological incident reconstruction & code archaeology</p>
          </div>
        </div>

        {/* Server & API Connectivity Hub */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 border border-slate-800 rounded-lg">
            <span className="text-slate-500">STATION_STATE:</span>
            {serverHealth === "checking" && (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> CHECKING
              </span>
            )}
            {serverHealth === "online" && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> ONLINE
              </span>
            )}
            {serverHealth === "offline" && (
              <span className="text-red-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFFLINE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 border border-slate-800 rounded-lg">
            <span className="text-slate-500">GEMINI_SECURE:</span>
            {apiKeyActive ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={11} /> SHIELDED
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle size={11} /> MOCK_FALLBACK
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-5">
        
        {/* Missing API Key Warning Banner */}
        {showKeyWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-amber-400 leading-relaxed font-medium">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Workspace Secret API Keys</span>
                <p className="text-slate-400 mt-0.5">
                  To stream authentic live-reconstructed summaries through the Google AI Studio build proxy, set your <code className="text-amber-400 font-mono bg-amber-500/5 px-1 rounded">GEMINI_API_KEY</code> inside the <b>Settings &gt; Secrets</b> tab. The application will continue running safely on the internal pre-cached forensic database.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKeyWarning(false)}
              className="px-2 py-1 border border-amber-500/30 hover:border-amber-500/60 rounded text-[10px] font-mono hover:text-white transition-colors self-end sm:self-center cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. SCENARIO SELECTOR - Clean bento row */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <span className="text-[10px] font-mono font-bold text-slate-500 block mb-3 uppercase tracking-wider">
            Select Active Incident Forensic Workspace
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isActive = selectedScenarioId === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-xs font-sans font-bold block">{sc.name}</span>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-900 text-slate-600"
                      }`}
                    >
                      {isActive ? "ACTIVE STAGE" : "READY"}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 leading-normal line-clamp-2">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. RECONSTRUCTION SEARCH BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Search size={12} />
              Ask the Git Decision Database
            </span>
            <p className="text-[10px] text-slate-400">
              Query why lines were deleted, who approved backdoors, or what triggered regressions inside the incident timeline.
            </p>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runReconstruction(searchQuery)}
              placeholder={`Ask: "${currentScenario.targetQuestion}"`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-700"
            />
            <button
              onClick={() => runReconstruction(searchQuery)}
              disabled={!searchQuery.trim() || isReconstructing}
              className="absolute right-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Send size={10} />
              <span>{isReconstructing ? "Parsing..." : "Reconstruct"}</span>
            </button>
          </div>

          {/* Prompt Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] font-mono text-slate-600 uppercase font-semibold mr-1">
              PROMPT SUGGESTIONS:
            </span>
            {currentScenario.defaultQuestions.map((question) => (
              <button
                key={question}
                onClick={() => {
                  setSearchQuery(question);
                  runReconstruction(question);
                }}
                className="text-[9px] font-mono bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* 3. PIPELINE WORKFLOW STATUS */}
        <PipelineWorkflow stages={pipelineStages} activeStageId={activeStageId} />

        {/* 4. AI REPORT PANEL - Dynamic Synthesis */}
        {aiAnswer && (
          <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5 shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950/20 animate-fade-in space-y-3.5">
            <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-400">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-sans font-bold text-slate-100">
                    Forensic Timeline Reconstructed Report
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500">
                    Model: {apiKeyActive ? "gemini-3.5-flash" : "Local Database Grounding Matcher"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                FORENSIC PROOF SECURED
              </span>
            </div>

            <div className="text-slate-300 leading-relaxed font-sans text-xs space-y-2 select-text whitespace-pre-wrap markdown-body bg-slate-950/40 p-4 rounded-lg border border-slate-800/60">
              {aiAnswer.split("\n\n").map((para, pidx) => {
                if (para.startsWith("###")) {
                  return (
                    <h4 key={pidx} className="text-xs font-bold text-slate-100 font-mono mt-3 mb-1 border-b border-slate-900 pb-1 uppercase tracking-wider text-indigo-400">
                      {para.replace("###", "").trim()}
                    </h4>
                  );
                }
                return <p key={pidx} className="leading-relaxed font-mono text-[11px] text-slate-300">{para}</p>;
              })}
            </div>

            {matchingEntities.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                <span>GRAPH NODES CORRELATED:</span>
                <div className="flex gap-1">
                  {matchingEntities.map((ent) => (
                    <span key={ent} className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. PRIMARY WORKSPACE MODULE SECTIONS - TAB SWITCHER */}
        <div className="flex flex-col gap-4">
          <div className="flex border-b border-slate-900 gap-1.5" id="workspace-navigator">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 border-b-2 text-xs font-bold font-mono tracking-tight transition-all cursor-pointer ${
                activeTab === "timeline"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-600/5 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch size={13} />
                <span>Forensic Incident Timeline</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-4 py-2 border-b-2 text-xs font-bold font-mono tracking-tight transition-all cursor-pointer ${
                activeTab === "graph"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-600/5 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Network size={13} />
                <span>Semantic Relationship Graph</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("connectors")}
              className={`px-4 py-2 border-b-2 text-xs font-bold font-mono tracking-tight transition-all cursor-pointer ${
                activeTab === "connectors"
                  ? "border-indigo-500 text-indigo-400 bg-indigo-600/5 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings2 size={13} />
                <span>Modular Integrations</span>
              </div>
            </button>
          </div>

          {/* Modular tab display render */}
          <div className="transition-all duration-300">
            {activeTab === "timeline" && (
              <InteractiveTimeline
                events={scenarioEvents}
                selectedEventId={selectedEventId}
                onSelectEvent={(id) => {
                  setSelectedEventId(id);
                  // Glow corresponding graph node too!
                  const evt = scenarioEvents.find((e) => e.id === id);
                  if (evt) {
                    const nodeMatch = scenarioNodes.find(
                      (n) => n.id.toLowerCase().includes(evt.author.toLowerCase()) || n.id.toLowerCase().includes(evt.refId.toLowerCase().replace("commit ", "co-").replace("issue #", "is-").replace("pr #", "pr-"))
                    );
                    if (nodeMatch) setSelectedNodeId(nodeMatch.id);
                  }
                }}
              />
            )}

            {activeTab === "graph" && (
              <KnowledgeGraphView
                nodes={scenarioNodes}
                edges={scenarioEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => {
                  setSelectedNodeId(id);
                  // Highlight corresponding timeline event too if available!
                  const matchedEvt = scenarioEvents.find(
                    (e) => e.author.toLowerCase() === id.toLowerCase() || e.refId.toLowerCase().replace("commit ", "co-").replace("issue #", "is-").replace("pr #", "pr-").includes(id.toLowerCase())
                  );
                  if (matchedEvt) setSelectedEventId(matchedEvt.id);
                }}
              />
            )}

            {activeTab === "connectors" && (
              <ConnectorIntegrations
                connectors={connectors}
                onToggleConnector={handleToggleConnector}
              />
            )}
          </div>
        </div>

      </div>

      {/* Cybernetic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen size={11} className="text-slate-600" />
            <span>INCIDENT FORENSICS STANDARDS & POLICY compliance block: LOCK-ID-77291</span>
          </div>
          <span>&copy; 2026 Knowledge Time Machine Inc. • Designed for modern engineering logs</span>
        </div>
      </footer>

    </div>
  );
}
