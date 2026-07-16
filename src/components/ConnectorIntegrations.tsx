import React, { useState } from "react";
import { Link2, Shield, Settings2, RefreshCw, Check, Code, GitPullRequest, Database, Inbox, AlertCircle } from "lucide-react";
import { ModularConnector } from "../types";

interface ConnectorIntegrationsProps {
  connectors: ModularConnector[];
  onToggleConnector: (connectorId: string, updatedFields: Record<string, string>) => void;
}

export default function ConnectorIntegrations({
  connectors,
  onToggleConnector,
}: ConnectorIntegrationsProps) {
  const [activeTab, setActiveTab] = useState<string>("github");
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const handleFieldChange = (connectorId: string, fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [connectorId]: {
        ...(prev[connectorId] || {}),
        [fieldName]: value,
      },
    }));
  };

  const handleSave = (conn: ModularConnector) => {
    const fields = formData[conn.id] || {};
    onToggleConnector(conn.id, fields);
  };

  const triggerSync = (connectorId: string) => {
    setIsSyncing((prev) => ({ ...prev, [connectorId]: true }));
    setTimeout(() => {
      setIsSyncing((prev) => ({ ...prev, [connectorId]: false }));
    }, 1500);
  };

  const activeConn = connectors.find((c) => c.id === activeTab) || connectors[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="connector-integrations-module">
      {/* Left List of available modular services */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
            Enterprise Integrations
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Synchronize external logs and communication threads to reconstruct the full decision graphs.
          </p>
        </div>

        <nav className="space-y-1 pt-2 border-t border-slate-800">
          {connectors.map((conn) => {
            const isActive = activeTab === conn.id;
            const isConnected = conn.status === "connected";

            return (
              <button
                key={conn.id}
                onClick={() => setActiveTab(conn.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 font-bold"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded ${
                      isConnected
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    <Link2 size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-sans font-bold block text-slate-200">
                      {conn.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {conn.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  {isConnected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
                    </span>
                  ) : (
                    <span className="text-slate-500">INACTIVE</span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Modular SDK Architecture Spec Box */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 mt-auto text-[10px] space-y-1.5 font-mono text-slate-400">
          <div className="flex items-center gap-1 text-slate-300">
            <Shield size={11} className="text-indigo-400" />
            <span className="font-bold">MODULAR SDK SPEC</span>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-500">
            The Knowledge Graph accepts unified payload events. New integrations (Jira, Slack, Notion) extend the <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">BaseConnector</code> class to inject events into the vector vectorDB without mutating Core timeline reconstructors.
          </p>
        </div>
      </div>

      {/* Right Service Config Panels */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full min-h-[380px]">
        {activeConn ? (
          <div className="flex flex-col h-full space-y-4">
            {/* Header properties */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider block">
                  Configuration Dashboard
                </span>
                <h3 className="text-xs font-sans font-bold text-slate-200 mt-0.5">
                  {activeConn.name} Integration Properties
                </h3>
              </div>

              {activeConn.status === "connected" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerSync(activeConn.id)}
                    disabled={isSyncing[activeConn.id]}
                    className="px-2.5 py-1 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 rounded text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      size={10}
                      className={isSyncing[activeConn.id] ? "animate-spin text-indigo-400" : ""}
                    />
                    <span>{isSyncing[activeConn.id] ? "Syncing..." : "Sync Logs"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Ingestion Metrics Overview */}
            {activeConn.status === "connected" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Events Ingested</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {activeConn.ingestedCount} events
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Last Synchronized</span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {activeConn.lastSync || "Never"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Inbound Webhook endpoint</span>
                  <span className="text-[10px] font-mono text-indigo-300 truncate block select-all">
                    {activeConn.webhookUrl || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-slate-400 text-xs flex items-center gap-2.5 font-medium leading-relaxed">
                <AlertCircle size={14} className="shrink-0 text-indigo-400" />
                <span>
                  This connector is not yet activated. Provide the configuration keys below to establish safe webhook listeners.
                </span>
              </div>
            )}

            {/* Config Fields Form */}
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block flex items-center gap-1">
                  <Settings2 size={12} />
                  API ENDPOINT & CRYPTO SECRET KEYSETS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeConn.configSchema.fields.map((fld) => (
                    <div key={fld.name} className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-medium font-mono">{fld.label}</label>
                      <input
                        type={fld.type}
                        value={formData[activeConn.id]?.[fld.name] || ""}
                        onChange={(e) => handleFieldChange(activeConn.id, fld.name, e.target.value)}
                        placeholder={fld.placeholder}
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="border-t border-slate-800 pt-3.5 mt-auto flex justify-end gap-2.5">
              <button
                onClick={() => handleSave(activeConn)}
                className={`px-3 py-1.5 rounded text-xs font-bold font-mono tracking-tight transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeConn.status === "connected"
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {activeConn.status === "connected" ? (
                  <>
                    <RefreshCw size={12} />
                    Update Secrets
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    Enable Webhook Integration
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Inbox size={20} />
            <span>Select an integration adapter</span>
          </div>
        )}
      </div>
    </div>
  );
}
