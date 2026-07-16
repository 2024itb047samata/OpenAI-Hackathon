import React from "react";
import { GitBranch, Database, Cpu, Compass, Clock, Terminal, Sparkles, Network } from "lucide-react";
import { PipelineStage } from "../types";

interface PipelineWorkflowProps {
  stages: PipelineStage[];
  activeStageId: string | null;
}

export default function PipelineWorkflow({ stages, activeStageId }: PipelineWorkflowProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case "ingestion":
        return <GitBranch size={15} />;
      case "extraction":
        return <Cpu size={15} />;
      case "graph":
        return <Network size={15} />;
      case "vector":
        return <Database size={15} />;
      case "timeline":
        return <Clock size={15} />;
      case "llm":
        return <Sparkles size={15} />;
      default:
        return <Compass size={15} />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl" id="pipeline-workflow-container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            RECONSTRUCTION ENGINE PIPELINE STATE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] font-mono text-slate-500">ENGINE OPERATIONAL</span>
        </div>
      </div>

      {/* Grid of pipeline stages */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {stages.map((stage, idx) => {
          const isActive = activeStageId === stage.id;
          const isSuccess = stage.status === "success";
          const isRunning = stage.status === "running";

          return (
            <div
              key={stage.id}
              className={`relative border rounded-lg p-3 transition-all flex flex-col gap-1.5 h-[105px] overflow-hidden ${
                isActive
                  ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : isRunning
                  ? "bg-amber-600/10 border-amber-500/50 animate-pulse"
                  : isSuccess
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-slate-950/60 border-slate-800/80"
              }`}
            >
              {/* Connected Line indicators */}
              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <div
                    className={`w-4 h-[1px] ${
                      isSuccess ? "bg-emerald-500/40" : "bg-slate-800"
                    }`}
                  />
                </div>
              )}

              {/* Status Indicator */}
              <div className="flex justify-between items-start">
                <div
                  className={`p-1.5 rounded-md ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : isSuccess
                      ? "bg-emerald-500/10 text-emerald-400"
                      : isRunning
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-900 text-slate-500"
                  }`}
                >
                  {getIcon(stage.id)}
                </div>

                <span
                  className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    isSuccess
                      ? "bg-emerald-500/10 text-emerald-400"
                      : isRunning
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-slate-900 text-slate-500"
                  }`}
                >
                  {stage.status}
                </span>
              </div>

              {/* Stage Metadata */}
              <div className="mt-auto">
                <span className="text-[11px] font-sans font-bold text-slate-200 block truncate">
                  {stage.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">
                  {stage.metrics || stage.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
