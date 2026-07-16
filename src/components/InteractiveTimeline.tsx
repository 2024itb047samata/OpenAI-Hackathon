import React, { useState } from "react";
import { GitCommit, GitPullRequest, AlertCircle, MessageSquare, Terminal, ChevronRight, ChevronDown, Clock, User } from "lucide-react";
import { WorkflowEvent } from "../types";

interface InteractiveTimelineProps {
  events: WorkflowEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export default function InteractiveTimeline({
  events,
  selectedEventId,
  onSelectEvent,
}: InteractiveTimelineProps) {
  const [expandedDiff, setExpandedDiff] = useState<Record<string, boolean>>({});

  const toggleDiff = (filePath: string) => {
    setExpandedDiff((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const getEventIcon = (type: string, severity: string) => {
    switch (type) {
      case "commit":
        return <GitCommit size={14} className="text-purple-400" />;
      case "pr":
        return <GitPullRequest size={14} className="text-indigo-400" />;
      case "issue":
        return <MessageSquare size={14} className="text-amber-400" />;
      case "ci_log":
        return severity === "error" ? (
          <AlertCircle size={14} className="text-red-400 animate-pulse" />
        ) : (
          <Terminal size={14} className="text-slate-400" />
        );
      default:
        return <Clock size={14} className="text-slate-500" />;
    }
  };

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="timeline-reconstruction-interface">
      {/* Left List of chronological milestones */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-[480px]">
        <span className="text-[10px] font-mono font-bold text-slate-500 block mb-3 uppercase tracking-wider border-b border-slate-800 pb-2">
          Chronological Event Log ({events.length} Milestones)
        </span>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {events.map((evt, idx) => {
            const isSelected = selectedEventId === evt.id;
            const eventDate = new Date(evt.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            });

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt.id)}
                className={`relative flex gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-100"
                    : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {/* Vertical trace connector line */}
                {idx < events.length - 1 && (
                  <div className="absolute left-[22px] top-[40px] w-[1px] h-[calc(100%-8px)] bg-slate-800 pointer-events-none" />
                )}

                {/* Event Marker */}
                <div
                  className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-indigo-500/20 border-indigo-400 text-indigo-400"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  {getEventIcon(evt.type, evt.severity)}
                </div>

                {/* Event summary details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      {eventDate} UTC
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 select-all font-semibold">
                      {evt.refId}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-sans font-bold leading-snug truncate">
                    {evt.title}
                  </h4>
                  <p className="text-[10px] font-mono leading-relaxed line-clamp-2 text-slate-500">
                    {evt.description}
                  </p>

                  {/* Entities tags */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {evt.entities.slice(0, 3).map((ent) => (
                      <span
                        key={ent}
                        className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 border border-slate-800 text-slate-400 rounded"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right properties & Code-Diff Inspector */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-[480px]">
        {activeEvent ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header metadata */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block">
                  Milestone Details
                </span>
                <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                  {activeEvent.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400">
                <User size={11} className="text-slate-500" />
                <span>By: {activeEvent.author}</span>
              </div>
            </div>

            {/* In-depth content area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs">
              {/* Event Description summary */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1.5 leading-relaxed">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                  Impact Abstract
                </span>
                <p className="font-mono text-slate-300 leading-relaxed text-[11px]">
                  {activeEvent.description}
                </p>
              </div>

              {/* 1. Commit Diff render block */}
              {activeEvent.details.commit && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    CODEBASE CHANGESETS
                  </span>

                  {activeEvent.details.commit.fileDiffs.map((diff) => {
                    const isExpanded = expandedDiff[diff.file] !== false; // Default true

                    return (
                      <div key={diff.file} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                        {/* File Header */}
                        <div
                          onClick={() => toggleDiff(diff.file)}
                          className="flex justify-between items-center bg-slate-900 px-3 py-2 border-b border-slate-800/80 cursor-pointer select-none text-[11px] font-mono"
                        >
                          <span className="text-slate-300 font-semibold">{diff.file}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 text-[10px]">+{diff.additions}</span>
                            <span className="text-red-400 text-[10px] mr-2">-{diff.deletions}</span>
                            {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
                          </div>
                        </div>

                        {/* Diff lines patch */}
                        {isExpanded && (
                          <div className="p-3 font-mono text-[10px] leading-relaxed overflow-x-auto select-text max-h-[220px]">
                            {diff.patch.split("\n").map((line, lidx) => {
                              const isAddition = line.startsWith("+");
                              const isDeletion = line.startsWith("-");
                              const isMeta = line.startsWith("@@");

                              return (
                                <div
                                  key={lidx}
                                  className={`px-2 py-0.5 whitespace-pre ${
                                    isAddition
                                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                                      : isDeletion
                                      ? "bg-red-500/10 text-red-400 border-l-2 border-red-500"
                                      : isMeta
                                      ? "text-slate-600 bg-slate-900/40"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. PR Review comment block */}
              {activeEvent.details.pr && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    PULL REQUEST CODE REVIEW LOG
                  </span>

                  <div className="space-y-2.5">
                    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
                      <span className="text-[10px] font-mono font-bold text-slate-600 block">PR BODY:</span>
                      <p className="text-slate-400 text-[11px] mt-1 italic">
                        "{activeEvent.details.pr.body}"
                      </p>
                    </div>

                    {activeEvent.details.pr.reviews.length > 0 && (
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">
                          Threaded Discussions ({activeEvent.details.pr.reviews.length})
                        </span>

                        {activeEvent.details.pr.reviews.map((rev) => (
                          <div key={rev.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1.5">
                              <span className="text-indigo-400 font-bold">{rev.author}</span>
                              <span className="text-slate-600">{rev.path}:{rev.line}</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-300 leading-relaxed select-text">
                              {rev.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Issue commentary */}
              {activeEvent.details.issue && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    ISSUE DISCUSSION THREAD
                  </span>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="text-[11px] font-mono text-slate-300 select-text leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                      {activeEvent.details.issue.body}
                    </div>

                    {activeEvent.details.issue.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-950 border border-slate-900/60 p-2.5 rounded space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                          <span className="text-amber-400 font-semibold">{comment.author}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 select-text leading-relaxed">
                          {comment.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CI Run console logs */}
              {activeEvent.details.ci && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    CI CONSOLE OUTPUT LOGS
                  </span>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    {/* Log status header */}
                    <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Duration: {activeEvent.details.ci.duration}</span>
                      <span className={`px-1.5 py-0.5 rounded uppercase ${
                        activeEvent.details.ci.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {activeEvent.details.ci.status}
                      </span>
                    </div>

                    {/* Console log content */}
                    <pre className="p-3 bg-slate-950 font-mono text-[10px] text-slate-400 leading-relaxed overflow-x-auto select-text max-h-[220px] whitespace-pre-wrap">
                      {activeEvent.details.ci.logs.join("\n")}
                    </pre>

                    {/* Stack trace box */}
                    {activeEvent.details.ci.failureSummary && (
                      <div className="bg-red-500/5 border-t border-red-500/20 p-3 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-red-400 uppercase">
                          Watchdog Failure Analysis
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                          {activeEvent.details.ci.failureSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1 text-center">
            <Clock size={20} />
            <span>Select a timeline milestone</span>
          </div>
        )}
      </div>
    </div>
  );
}
