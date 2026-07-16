export type ArtifactType = "commit" | "pr" | "issue" | "review_comment" | "ci_log";

export interface FileDiff {
  file: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface CommitDetail {
  hash: string;
  author: string;
  date: string;
  message: string;
  fileDiffs: FileDiff[];
}

export interface ReviewComment {
  id: string;
  author: string;
  path: string;
  line: number;
  body: string;
  replyTo?: string;
}

export interface PRDetail {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  author: string;
  createdAt: string;
  mergedAt?: string;
  body: string;
  commits: string[];
  reviews: ReviewComment[];
}

export interface IssueComment {
  id: string;
  author: string;
  createdAt: string;
  body: string;
}

export interface IssueDetail {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  createdAt: string;
  body: string;
  comments: IssueComment[];
}

export interface CILogDetail {
  buildNumber: number;
  status: "success" | "failed" | "running";
  duration: string;
  logs: string[];
  failureSummary?: string;
  environment: string;
}

export interface WorkflowEvent {
  id: string;
  scenarioId: string;
  type: ArtifactType;
  title: string;
  timestamp: string;
  author: string;
  refId: string; // e.g. "PR #101" or "commit db01a2f"
  description: string;
  entities: string[]; // e.g. ["Redis", "Memory", "bob_ops"]
  severity: "info" | "warn" | "error" | "success";
  details: {
    commit?: CommitDetail;
    pr?: PRDetail;
    issue?: IssueDetail;
    ci?: CILogDetail;
  };
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: "issue" | "pr" | "commit" | "author" | "service" | "ci_run" | "tech_stack";
  group: string;
  x?: number;
  y?: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface VectorDoc {
  id: string;
  type: ArtifactType;
  sourceRef: string;
  title: string;
  content: string;
  similarity?: number;
}

export interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  targetQuestion: string;
  defaultQuestions: string[];
}

export interface ModularConnector {
  id: string;
  name: string;
  type: "github" | "jira" | "slack" | "notion";
  status: "connected" | "disconnected" | "configuring";
  webhookUrl?: string;
  lastSync?: string;
  ingestedCount: number;
  configSchema: {
    fields: {
      name: string;
      label: string;
      type: "text" | "password" | "select";
      placeholder: string;
      options?: string[];
    }[];
  };
}

export interface PipelineStage {
  id: "ingestion" | "extraction" | "graph" | "vector" | "timeline" | "llm";
  name: string;
  description: string;
  status: "idle" | "running" | "success" | "failed";
  metrics?: string;
}
