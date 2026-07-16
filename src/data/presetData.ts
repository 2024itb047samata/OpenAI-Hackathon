import { Scenario, WorkflowEvent, KnowledgeGraphNode, KnowledgeGraphEdge, VectorDoc, ModularConnector } from "../types";

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: "redis-incident",
    name: "Redis Removal Cache Spill",
    subtitle: "Licensing cost reduction leading to memory leak and performance degradation",
    description: "Reconstructs the timeline of how deleting the cloud Redis container in favor of an in-process memory cache bypassed memory limits and crashed the API.",
    targetQuestion: "Why was Redis removed and what caused the regression?",
    defaultQuestions: [
      "Why was Redis removed?",
      "What caused this regression?",
      "Who approved the Redis removal PR?",
      "Show me the file diff where the memory leak started"
    ]
  },
  {
    id: "auth-bypass",
    name: "Auth Bypass Testing Leak",
    subtitle: "Temporary MD5 validation bypass leaking into production build",
    description: "Reveals how a fast-track hotfix containing a cryptographic bypass and bypassed CodeQL check slipped through reviewers into the master branch.",
    targetQuestion: "Who introduced this bug and why was the security check ignored?",
    defaultQuestions: [
      "Who introduced this bug?",
      "Why was the security check ignored?",
      "Show me the CodeQL warning log",
      "Which commit restored secure token decryption?"
    ]
  },
  {
    id: "orphaned-sync",
    name: "S3 Storage Sync Cleanup",
    subtitle: "Cleanup routine deleted as 'dead code' causing AWS cost spike",
    description: "Traces why a vital background S3 synchronization and bucket pruning script was deleted under a general house-cleaning task.",
    targetQuestion: "Why was this function deleted and what was the consequence?",
    defaultQuestions: [
      "Why was this function deleted?",
      "What was the consequence of deleting the storage service?",
      "Show me the file diff of the deleted service",
      "Who requested the house-cleaning refactor?"
    ]
  }
];

export const WORKFLOW_EVENTS: Record<string, WorkflowEvent[]> = {
  "redis-incident": [
    {
      id: "ev-101",
      scenarioId: "redis-incident",
      type: "issue",
      title: "Issue #101: Staging cloud resources optimization",
      timestamp: "2026-07-10T10:00:00Z",
      author: "alice_dev",
      refId: "Issue #101",
      description: "Cloud budget is 25% over limits. Staging AWS instances are costing $450/mo. We need to optimize and downscale idle containers.",
      entities: ["AWS", "Budget", "alice_dev"],
      severity: "info",
      details: {
        issue: {
          number: 101,
          title: "Staging cloud resources optimization",
          state: "closed",
          author: "alice_dev",
          createdAt: "2026-07-10T10:00:00Z",
          body: "As flagged by Finance, our sandbox clusters are using high-tier ElastiCache instances. Let's find out if we can run without external caches on staging/dev environments to meet downscaling requirements.",
          comments: [
            {
              id: "c-1",
              author: "bob_ops",
              createdAt: "2026-07-10T11:30:00Z",
              body: "I will review the staging Compose and ECS setups. We are running Redis mainly for user session lookup and token blacklisting. We can easily substitute that with something lightweight to kill the Redis instance costs."
            }
          ]
        }
      }
    },
    {
      id: "ev-102",
      scenarioId: "redis-incident",
      type: "pr",
      title: "Pull Request #405: Remove Redis dependency and migrate to Local Dictionary Cache",
      timestamp: "2026-07-11T14:20:00Z",
      author: "bob_ops",
      refId: "PR #405",
      description: "Bypasses the remote Redis server by implementing an in-process local dictionary cache. Deletes Redis container definitions.",
      entities: ["Redis", "PR #405", "bob_ops", "CacheService"],
      severity: "warn",
      details: {
        pr: {
          number: 405,
          title: "Remove Redis dependency and migrate to Local Dictionary Cache",
          state: "merged",
          author: "bob_ops",
          createdAt: "2026-07-11T14:20:00Z",
          mergedAt: "2026-07-12T09:15:00Z",
          body: "Saves $120/month per developer sandbox. Rewrites token and session validation to store state in a standard key-value map inside memory. No more external cluster connection timeouts!",
          commits: ["7b8e1a2"],
          reviews: [
            {
              id: "rev-1",
              author: "alice_dev",
              path: "src/services/cache.js",
              line: 12,
              body: "Wait, isn't this cache unbound? If we add every single API token to the global `localCache` dictionary and never delete them, won't it eventually exhaust the Node heap space and crash?"
            },
            {
              id: "rev-2",
              author: "bob_ops",
              path: "src/services/cache.js",
              line: 14,
              body: "Staging sandboxes recycle every 24 hours anyway because of auto-deployments, and memory footprints are tiny. So it shouldn't be an issue. Let's merge this to quickly cut down costs."
            }
          ]
        }
      }
    },
    {
      id: "ev-103",
      scenarioId: "redis-incident",
      type: "commit",
      title: "Commit 7b8e1a2: infra: remove Redis cluster and route sessions to LocalMap",
      timestamp: "2026-07-11T14:45:00Z",
      author: "bob_ops",
      refId: "Commit 7b8e1a2",
      description: "Modifies standard docker-compose and deletes Redis container. Implements simple Map backend.",
      entities: ["bob_ops", "Commit 7b8e1a2", "docker-compose.yml"],
      severity: "warn",
      details: {
        commit: {
          hash: "7b8e1a2",
          author: "bob_ops",
          date: "2026-07-11T14:45:00Z",
          message: "infra: remove Redis cluster and route sessions to LocalMap to slash AWS budget.",
          fileDiffs: [
            {
              file: "docker-compose.yml",
              additions: 1,
              deletions: 12,
              patch: `@@ -12,12 +12,1 @@ services:
-  redis:
-    image: redis:6-alpine
-    ports:
-      - "6379:6379"
-    volumes:
-      - redis_data:/data
-    restart: always
-  backend:
-    depends_on:
-      - redis
+  backend:
-    environment:
-      - REDIS_URL=redis://redis:6379
+    environment:
+      - CACHE_BACKEND=local`
            },
            {
              file: "src/services/cache.js",
              additions: 15,
              deletions: 5,
              patch: `@@ -4,5 +4,15 @@
-const Redis = require('ioredis');
-const client = new Redis(process.env.REDIS_URL);
+
+const localCache = {}; // FAST IN-MEMORY REPLACEMENT
 
 module.exports = {
-  get: async (key) => client.get(key),
-  set: async (key, val) => client.set(key, val)
+  get: async (key) => {
+    return localCache[key] || null;
+  },
+  set: async (key, val) => {
+    // Store token globally - Bob: quick bypass
+    localCache[key] = val; 
+    return true;
+  }
 };`
            }
          ]
        }
      }
    },
    {
      id: "ev-104",
      scenarioId: "redis-incident",
      type: "ci_log",
      title: "CI Pipeline Run #902: FAILED - Heap out of memory during automated longevity test",
      timestamp: "2026-07-13T01:30:00Z",
      author: "GitHub Actions",
      refId: "Build #902",
      description: " Longevity test run simulating 15,000 concurrent tokens crashed after 2 hours with FATAL ERROR: Ineffective mark-compacts near heap limit.",
      entities: ["CI", "Memory", "NodeJS"],
      severity: "error",
      details: {
        ci: {
          buildNumber: 902,
          status: "failed",
          duration: "2h 14m",
          environment: "Staging Pipeline",
          logs: [
            "[00:01:10] SPAWNED: Longevity Traffic Simulator on staging.api.internal",
            "[00:30:00] INFO: Processed 5,000 auth handshakes. Memory Usage: 340MB",
            "[01:15:00] INFO: Processed 10,000 auth handshakes. Memory Usage: 1.2GB",
            "[02:05:00] WARNING: GC activity spiked > 80% CPU runtime",
            "[02:12:10] ERROR: FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory",
            "[02:13:00] CRITICAL: Container healthcheck failed! Staging cluster offline."
          ],
          failureSummary: "API server container ran out of heap memory because active login tokens are stored permanently in the raw `localCache` object with no TTL or pruning mechanism."
        }
      }
    },
    {
      id: "ev-105",
      scenarioId: "redis-incident",
      type: "commit",
      title: "Commit fa9c12a: hotfix: implement LRU eviction policy for local session store",
      timestamp: "2026-07-13T08:50:00Z",
      author: "charlie_arch",
      refId: "Commit fa9c12a",
      description: "Charlie steps in to solve the memory leak by replacing the raw dictionary with an LRU (Least Recently Used) cache bounded to 1000 items.",
      entities: ["charlie_arch", "Commit fa9c12a", "LRUCache"],
      severity: "success",
      details: {
        commit: {
          hash: "fa9c12a",
          author: "charlie_arch",
          date: "2026-07-13T08:50:00Z",
          message: "hotfix: implement LRU eviction policy for local session store to resolve PR #405 memory leak.",
          fileDiffs: [
            {
              file: "src/services/cache.js",
              additions: 18,
              deletions: 4,
              patch: `@@ -4,3 +4,18 @@
-const localCache = {}; 
+const { LRUCache } = require('lru-cache');
+
+// Limit the local store to 1000 active sessions to prevent leaks
+const localCache = new LRUCache({
+  max: 1000,
+  ttl: 1000 * 60 * 15 // 15 mins expiry
+});
 
 module.exports = {
   get: async (key) => {
-    return localCache[key] || null;
+    return localCache.get(key) || null;
   },
   set: async (key, val) => {
-    localCache[key] = val;
+    localCache.set(key, val);
     return true;
   }
 };`
            }
          ]
        }
      }
    }
  ],
  "auth-bypass": [
    {
      id: "ev-201",
      scenarioId: "auth-bypass",
      type: "issue",
      title: "Issue #202: JWT parsing latency degradation on mobile requests",
      timestamp: "2026-07-01T09:00:00Z",
      author: "charlie_arch",
      refId: "Issue #202",
      description: "Profile metrics indicate cryptographically heavy signatures are bottlenecks on the dev sandboxes, holding up mobile testing runs.",
      entities: ["JWT", "charlie_arch", "Performance"],
      severity: "info",
      details: {
        issue: {
          number: 202,
          title: "JWT parsing latency degradation on mobile requests",
          state: "closed",
          author: "charlie_arch",
          createdAt: "2026-07-01T09:00:00Z",
          body: "Vite dev runners are taking over 300ms to verify JWT tokens during automation cycles because of complex bcrypt verification cycles. Is there a way to simplify?",
          comments: [
            {
              id: "c-201",
              author: "bob_ops",
              createdAt: "2026-07-01T11:00:00Z",
              body: "I'll craft a temporary test bypass helper so integration rigs don't have to verify raw cryptography in local simulation mode."
            }
          ]
        }
      }
    },
    {
      id: "ev-202",
      scenarioId: "auth-bypass",
      type: "commit",
      title: "Commit db01a2f: bypass: add temporary MD5 bypass verification backdoor",
      timestamp: "2026-07-01T15:40:00Z",
      author: "bob_ops",
      refId: "Commit db01a2f",
      description: "Bob commits an unsafe backdoor that checks if the JWT payload signature is 'test-override' or MD5 hash to bypass the production HMAC validation.",
      entities: ["bob_ops", "Commit db01a2f", "SecurityBypass"],
      severity: "error",
      details: {
        commit: {
          hash: "db01a2f",
          author: "bob_ops",
          date: "2026-07-01T15:40:00Z",
          message: "bypass: add temporary MD5 bypass verification backdoor for local test integration suites.",
          fileDiffs: [
            {
              file: "src/auth.js",
              additions: 11,
              deletions: 2,
              patch: `@@ -42,2 +42,11 @@ function verifyToken(token) {
   try {
+    // TODO: DO NOT MERGE TO PROD - Bob: Speed up dev test verification
+    if (token === "test-override" || token.startsWith("md5-")) {
+      console.warn("WARNING: Cryptographic bypass active!");
+      return { user: "admin", roles: ["admin", "root"] };
+    }
+
     return jwt.verify(token, process.env.SECRET_KEY);`
            }
          ]
        }
      }
    },
    {
      id: "ev-203",
      scenarioId: "auth-bypass",
      type: "ci_log",
      title: "CI Pipeline Run #945: WARNING - CodeQL static audit triggered critical alerts",
      timestamp: "2026-07-02T10:15:00Z",
      author: "CodeQL Security",
      refId: "Build #945",
      description: "CodeQL scanner triggered a critical vulnerability flag on 'Hardcoded token validation bypass' in `src/auth.js` line 44.",
      entities: ["CodeQL", "SecurityCheck", "CI"],
      severity: "warn",
      details: {
        ci: {
          buildNumber: 945,
          status: "failed", // Blocked by security policy
          duration: "4m 12s",
          environment: "Main Branch Integration",
          logs: [
            "[10:11:00] STEP: Initialize CodeQL Analysis Engine...",
            "[10:12:30] RUNNING: JavaScript / TypeScript Security Rules scan",
            "[10:13:45] CRITICAL ALERT: Security Bypass detected in src/auth.js:44",
            "[10:13:46]   >> Rule: 'Hardcoded credentials bypass detection' [Severity: Critical]",
            "[10:13:47]   >> Context: checking hardcoded strings 'test-override' bypasses crypto verify.",
            "[10:14:00] ERROR: Build blocked. Security checks failed on staging."
          ],
          failureSummary: "Bob's development backdoor was picked up by CodeQL, blocking the build from completing. However, the blockage was manually overwritten to proceed by dave_manager."
        }
      }
    },
    {
      id: "ev-204",
      scenarioId: "auth-bypass",
      type: "pr",
      title: "Pull Request #411: Bypassed warning approval to unlock staging pipeline block",
      timestamp: "2026-07-02T11:30:00Z",
      author: "dave_manager",
      refId: "PR #411",
      description: "Dave overrides the CodeQL build error, stating the MD5 bypass is necessary for sandboxed mobile test environments to keep integration green.",
      entities: ["dave_manager", "PR #411", "Override"],
      severity: "error",
      details: {
        pr: {
          number: 411,
          title: "Bypassed warning approval to unlock staging pipeline block",
          state: "merged",
          author: "dave_manager",
          createdAt: "2026-07-02T11:30:00Z",
          mergedAt: "2026-07-02T12:00:00Z",
          body: "Administrative merge block override. We have an active release demo for the board tomorrow and cannot let CodeQL rules block integration runs right now.",
          commits: ["db01a2f"],
          reviews: [
            {
              id: "rev-201",
              author: "charlie_arch",
              path: "src/auth.js",
              line: 44,
              body: "Dave, this allows anyone who sends the string 'test-override' as their auth header to get full root admin privileges. This is in the core production router bundle!"
            },
            {
              id: "rev-202",
              author: "dave_manager",
              path: "src/auth.js",
              line: 46,
              body: "Our cloud VPC has security layers blocking raw exterior HTTP probes. We will revert this hotfix immediately after the demo. Approve."
            }
          ]
        }
      }
    },
    {
      id: "ev-205",
      scenarioId: "auth-bypass",
      type: "commit",
      title: "Commit 9c2041e: security: delete test-override backdoor, restore strong AES SHA-256 validation",
      timestamp: "2026-07-04T16:20:00Z",
      author: "alice_dev",
      refId: "Commit 9c2041e",
      description: "After the demo, Alice notices the bypass was left active and cleans up the backdoor immediately, re-enabling strict JWT validation.",
      entities: ["alice_dev", "Commit 9c2041e", "JWTRecovery"],
      severity: "success",
      details: {
        commit: {
          hash: "9c2041e",
          author: "alice_dev",
          date: "2026-07-04T16:20:00Z",
          message: "security: delete test-override backdoor, restore strong AES SHA-256 validation to avoid auth vulnerability.",
          fileDiffs: [
            {
              file: "src/auth.js",
              additions: 1,
              deletions: 11,
              patch: `@@ -42,11 +42,1 @@ function verifyToken(token) {
   try {
-    if (token === "test-override" || token.startsWith("md5-")) {
-      console.warn("WARNING: Cryptographic bypass active!");
-      return { user: "admin", roles: ["admin", "root"] };
-    }
-
     return jwt.verify(token, process.env.SECRET_KEY);`
            }
          ]
        }
      }
    }
  ],
  "orphaned-sync": [
    {
      id: "ev-301",
      scenarioId: "orphaned-sync",
      type: "issue",
      title: "Issue #315: Codebase Cleanup: Remove legacy unused helper files",
      timestamp: "2026-06-15T08:00:00Z",
      author: "dave_manager",
      refId: "Issue #315",
      description: "Task request to audit code files and delete unused services to increase developer clarity and streamline Docker image builds.",
      entities: ["Cleanup", "dave_manager"],
      severity: "info",
      details: {
        issue: {
          number: 315,
          title: "Codebase Cleanup: Remove legacy unused helper files",
          state: "closed",
          author: "dave_manager",
          createdAt: "2026-06-15T08:00:00Z",
          body: "We have dozens of stale files in `/src/services`. Let's identify things that aren't imported inside App.tsx or index.js and prune them out.",
          comments: [
            {
              id: "c-301",
              author: "bob_ops",
              createdAt: "2026-06-15T09:30:00Z",
              body: "On it! I will scan for unreferenced modules in our dynamic modules list and purge them. It will make the docker size even smaller!"
            }
          ]
        }
      }
    },
    {
      id: "ev-302",
      scenarioId: "orphaned-sync",
      type: "commit",
      title: "Commit 1f4e5a9: refactor: delete unused storage_sync_cleanup_service",
      timestamp: "2026-06-16T14:15:00Z",
      author: "bob_ops",
      refId: "Commit 1f4e5a9",
      description: "Bob deletes the service file because there are no explicit static import statements for it in the central App bundle.",
      entities: ["bob_ops", "Commit 1f4e5a9", "AWS_S3"],
      severity: "warn",
      details: {
        commit: {
          hash: "1f4e5a9",
          author: "bob_ops",
          date: "2026-06-16T14:15:00Z",
          message: "refactor: delete unused storage_sync_cleanup_service.js from codebase to reduce clutter.",
          fileDiffs: [
            {
              file: "src/services/storage_sync_cleanup_service.js",
              additions: 0,
              deletions: 22,
              patch: `@@ -1,22 +0,0 @@
-const AWS = require('aws-sdk');
-const s3 = new AWS.S3();
-
-// CRON Sync triggered by Lambda, not server import!
-async function pruneStaleS3Backups() {
-  console.log("Starting S3 Pruning...");
-  const list = await s3.listObjects({ Bucket: "production-blobs" }).promise();
-  const stale = list.Contents.filter(item => {
-    const days = (new Date() - new Date(item.LastModified)) / (1000 * 60 * 60 * 24);
-    return days > 7; // Prune objects older than 7 days
-  });
-  
-  for (const obj of stale) {
-    await s3.deleteObject({ Bucket: "production-blobs", Key: obj.Key }).promise();
-    console.log("Deleted orphan storage file: " + obj.Key);
-  }
-}
-
-module.exports = { pruneStaleS3Backups };`
            }
          ]
        }
      }
    },
    {
      id: "ev-303",
      scenarioId: "orphaned-sync",
      type: "pr",
      title: "Pull Request #320: Code Cleanup and Pruning Stale Controllers",
      timestamp: "2026-06-16T15:00:00Z",
      author: "bob_ops",
      refId: "PR #320",
      description: "PR merges Bob's cleaning commits, removing AWS storage synchronization files.",
      entities: ["bob_ops", "PR #320", "AWS_S3"],
      severity: "warn",
      details: {
        pr: {
          number: 320,
          title: "Code Cleanup and Pruning Stale Controllers",
          state: "merged",
          author: "bob_ops",
          createdAt: "2026-06-16T15:00:00Z",
          mergedAt: "2026-06-17T09:00:00Z",
          body: "Cleans up 4 old endpoints and 2 standalone services. Verified that nothing in Node's main imports depends on them.",
          commits: ["1f4e5a9"],
          reviews: [
            {
              id: "rev-301",
              author: "alice_dev",
              path: "src/services/storage_sync_cleanup_service.js",
              line: 4,
              body: "Wait, Bob! This S3 sync cleanup service isn't imported statically by the app because it gets run by a standalone cron job script in our Lambda container using `node -e \"require('./src/services/storage_sync_cleanup_service').pruneStaleS3Backups()\"`. If we delete the file, the cron task will start crashing with Cannot find module!"
            },
            {
              id: "rev-302",
              author: "bob_ops",
              path: "src/services/storage_sync_cleanup_service.js",
              line: 6,
              body: "Oops! Good catch, but we already merged the PR to main and deploy passed. Let me check the cloud budget. Wait, the AWS bills are fine."
            }
          ]
        }
      }
    },
    {
      id: "ev-304",
      scenarioId: "orphaned-sync",
      type: "ci_log",
      title: "CI Pipeline Run #1004: PASS - Build compiled but AWS billing triggers extreme usage alert",
      timestamp: "2026-06-25T03:00:00Z",
      author: "AWS Watchdog",
      refId: "S3 Alarm",
      description: "AWS cloud cost watchdog triggers a high-severity alert: bucket storage 'production-blobs' reached 14.5TB (spike of 450% from base budget).",
      entities: ["AWS", "Budget", "CI"],
      severity: "error",
      details: {
        ci: {
          buildNumber: 1004,
          status: "failed",
          duration: "1m 30s",
          environment: "Lambda CRON Engine",
          logs: [
            "[00:01:00] AWS CRON Daemon: trigger pruneStaleS3Backups() event",
            "[00:01:01] RUNNING: node -e \"require('./src/services/storage_sync_cleanup_service').pruneStaleS3Backups()\"",
            "[00:01:02] ERROR: node:internal/modules/cjs/loader:1080",
            "[00:01:03]   Error: Cannot find module './src/services/storage_sync_cleanup_service'",
            "[00:01:04]   at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)",
            "[00:01:05] CRITICAL: Lambda Cron Exited with error code 1. No files pruned!"
          ],
          failureSummary: "Deletion of the S3 sync service file broke the Lambda task. For 10 days, transient debug blobs generated by test suites kept multiplying, leading to a storage fee spike of $1,200."
        }
      }
    }
  ]
};

export const KNOWLEDGE_GRAPH_NODES: Record<string, KnowledgeGraphNode[]> = {
  "redis-incident": [
    { id: "alice_dev", label: "alice_dev (Senior Dev)", type: "author", group: "people" },
    { id: "bob_ops", label: "bob_ops (DevOps)", type: "author", group: "people" },
    { id: "charlie_arch", label: "charlie_arch (Architect)", type: "author", group: "people" },
    { id: "is-101", label: "Issue #101: Downscale Staging", type: "issue", group: "issues" },
    { id: "pr-405", label: "PR #405: Migrate to LocalCache", type: "pr", group: "prs" },
    { id: "co-7b8e1a2", label: "Commit 7b8e1a2: Remove Redis", type: "commit", group: "commits" },
    { id: "ci-902", label: "CI Build #902: Heap OOM Failure", type: "ci_run", group: "ci" },
    { id: "co-fa9c12a", label: "Commit fa9c12a: Bounded LRU Hotfix", type: "commit", group: "commits" },
    { id: "redis", label: "AWS ElastiCache Redis", type: "tech_stack", group: "stack" },
    { id: "cache-service", label: "cache.js Service", type: "service", group: "code" }
  ],
  "auth-bypass": [
    { id: "bob_ops", label: "bob_ops (DevOps)", type: "author", group: "people" },
    { id: "charlie_arch", label: "charlie_arch (Architect)", type: "author", group: "people" },
    { id: "alice_dev", label: "alice_dev (Senior Dev)", type: "author", group: "people" },
    { id: "dave_manager", label: "dave_manager (Product Lead)", type: "author", group: "people" },
    { id: "is-202", label: "Issue #202: JWT Latency Check", type: "issue", group: "issues" },
    { id: "co-db01a2f", label: "Commit db01a2f: Backdoor MD5", type: "commit", group: "commits" },
    { id: "ci-945", label: "CI Build #945: CodeQL Warning", type: "ci_run", group: "ci" },
    { id: "pr-411", label: "PR #411: Administrative Override", type: "pr", group: "prs" },
    { id: "co-9c2041e", label: "Commit 9c2041e: Clean Backdoor", type: "commit", group: "commits" },
    { id: "auth-service", label: "auth.js Gateway Router", type: "service", group: "code" }
  ],
  "orphaned-sync": [
    { id: "bob_ops", label: "bob_ops (DevOps)", type: "author", group: "people" },
    { id: "alice_dev", label: "alice_dev (Senior Dev)", type: "author", group: "people" },
    { id: "dave_manager", label: "dave_manager (Product Lead)", type: "author", group: "people" },
    { id: "is-315", label: "Issue #315: Codebase Cleaning", type: "issue", group: "issues" },
    { id: "co-1f4e5a9", label: "Commit 1f4e5a9: Delete sync helper", type: "commit", group: "commits" },
    { id: "pr-320", label: "PR #320: Cleanup controllers", type: "pr", group: "prs" },
    { id: "ci-1004", label: "Lambda Cron Fail: Billing Alarm", type: "ci_run", group: "ci" },
    { id: "aws-s3", label: "AWS S3 production-blobs", type: "tech_stack", group: "stack" },
    { id: "sync-service", label: "storage_sync_cleanup_service.js", type: "service", group: "code" }
  ]
};

export const KNOWLEDGE_GRAPH_EDGES: Record<string, KnowledgeGraphEdge[]> = {
  "redis-incident": [
    { id: "ed1", source: "alice_dev", target: "is-101", relation: "authored" },
    { id: "ed2", source: "bob_ops", target: "is-101", relation: "resolved" },
    { id: "ed3", source: "bob_ops", target: "co-7b8e1a2", relation: "committed" },
    { id: "ed4", source: "co-7b8e1a2", target: "pr-405", relation: "part_of" },
    { id: "ed5", source: "alice_dev", target: "pr-405", relation: "reviewed" },
    { id: "ed6", source: "co-7b8e1a2", target: "cache-service", relation: "modified" },
    { id: "ed7", source: "cache-service", target: "redis", relation: "disconnected_from" },
    { id: "ed8", source: "pr-405", target: "ci-902", relation: "triggered" },
    { id: "ed9", source: "ci-902", target: "cache-service", relation: "failed_on" },
    { id: "ed10", source: "charlie_arch", target: "co-fa9c12a", relation: "committed" },
    { id: "ed11", source: "co-fa9c12a", target: "cache-service", relation: "patched_leak" }
  ],
  "auth-bypass": [
    { id: "ed201", source: "charlie_arch", target: "is-202", relation: "reported" },
    { id: "ed202", source: "bob_ops", target: "co-db01a2f", relation: "committed" },
    { id: "ed203", source: "co-db01a2f", target: "auth-service", relation: "altered" },
    { id: "ed204", source: "co-db01a2f", target: "ci-945", relation: "triggered_security_check" },
    { id: "ed205", source: "ci-945", target: "pr-411", relation: "blocked" },
    { id: "ed206", source: "dave_manager", target: "pr-411", relation: "approved_with_bypass" },
    { id: "ed207", source: "charlie_arch", target: "pr-411", relation: "commented_danger" },
    { id: "ed208", source: "alice_dev", target: "co-9c2041e", relation: "committed_fix" },
    { id: "ed209", source: "co-9c2041e", target: "auth-service", relation: "hardened_security" }
  ],
  "orphaned-sync": [
    { id: "ed301", source: "dave_manager", target: "is-315", relation: "requested" },
    { id: "ed302", source: "bob_ops", target: "co-1f4e5a9", relation: "committed" },
    { id: "ed303", source: "co-1f4e5a9", target: "sync-service", relation: "deleted" },
    { id: "ed304", source: "co-1f4e5a9", target: "pr-320", relation: "part_of" },
    { id: "ed305", source: "alice_dev", target: "pr-320", relation: "cautioned_of_lambda" },
    { id: "ed306", source: "pr-320", target: "ci-1004", relation: "subsequently_broke" },
    { id: "ed307", source: "ci-1004", target: "aws-s3", relation: "caused_storage_inflation_on" }
  ]
};

export const VECTOR_DOCS: Record<string, VectorDoc[]> = {
  "redis-incident": [
    {
      id: "vd-1",
      type: "issue",
      sourceRef: "Issue #101",
      title: "Cost budget scale-down rules",
      content: "Staging cloud resources optimization requested. We need to terminate the staging cluster ElastiCache nodes. Session state can reside in local in-memory dictionaries during development testing to save resources."
    },
    {
      id: "vd-2",
      type: "pr",
      sourceRef: "PR #405",
      title: "Redis replacement reviews",
      content: "PR discussion on local dictionary replacement cache. Alice warned about memory leaks and unbound storage growing under traffic. Bob commented that staging containers recycle often enough, bypassing leak checks."
    },
    {
      id: "vd-3",
      type: "commit",
      sourceRef: "Commit 7b8e1a2",
      title: "infra: remove redis cluster",
      content: "Commit 7b8e1a2 by bob_ops. Modifies docker-compose.yml and src/services/cache.js. Discards remote cache client config in favor of basic localCache empty Javascript Object map store."
    },
    {
      id: "vd-4",
      type: "ci_log",
      sourceRef: "Build #902",
      title: "Heap OOM error breakdown",
      content: "CI logs show Javascript Heap Out of Memory error during longevity cycles simulating 15,000 auth tokens. Unbound global dictionary storage reached memory allocation limits."
    }
  ],
  "auth-bypass": [
    {
      id: "vd-201",
      type: "commit",
      sourceRef: "Commit db01a2f",
      title: "Bypass verification backdoor",
      content: "Bob committed a quick bypass for auth tokens checking if the token equals 'test-override' or starts with 'md5-'. This is a quick test override routine."
    },
    {
      id: "vd-202",
      type: "ci_log",
      sourceRef: "Build #945",
      title: "CodeQL Security Alert details",
      content: "CodeQL audit warnings for Hardcoded credentials security bypasses on auth.js line 44. Critical severity level security alerts."
    },
    {
      id: "vd-203",
      type: "pr",
      sourceRef: "PR #411",
      title: "PR CodeQL override logic",
      content: "Dave approved PR #411 despite Charlie noting the dangerous root bypass bypass backdoor because a critical client dashboard demo was due."
    }
  ],
  "orphaned-sync": [
    {
      id: "vd-301",
      type: "commit",
      sourceRef: "Commit 1f4e5a9",
      title: "Pruning unused S3 syncer",
      content: "Bob deleted storage_sync_cleanup_service.js because it was not imported anywhere in App bundle imports, thinking it was orphan dead code."
    },
    {
      id: "vd-302",
      type: "pr",
      sourceRef: "PR #320",
      title: "PR sync deletion warning",
      content: "Alice commented in PR #320 that the S3 syncer file is vital for AWS Lambda cron processes triggered dynamically in production."
    },
    {
      id: "vd-303",
      type: "ci_log",
      sourceRef: "S3 Alarm",
      title: "S3 cost alarm storage overflow",
      content: "AWS bucket production-blobs spiked to 14.5TB. Missing cleanup script crashed cron triggering S3 accumulation of temporary debug zip archives."
    }
  ]
};

export const MODULAR_CONNECTORS: ModularConnector[] = [
  {
    id: "github",
    name: "GitHub Enterprise",
    type: "github",
    status: "connected",
    webhookUrl: "https://time-machine.api.io/webhooks/github",
    lastSync: "2026-07-15 22:45:10 UTC",
    ingestedCount: 452,
    configSchema: {
      fields: [
        { name: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_xxxxxxxxxxxx" },
        { name: "repo", label: "Target Repository", type: "text", placeholder: "owner/repository" },
        { name: "branch", label: "Primary Branch", type: "text", placeholder: "main" }
      ]
    }
  },
  {
    id: "jira",
    name: "Jira Cloud",
    type: "jira",
    status: "disconnected",
    ingestedCount: 0,
    configSchema: {
      fields: [
        { name: "host", label: "Atlassian Site URL", type: "text", placeholder: "company.atlassian.net" },
        { name: "email", label: "Account Email", type: "text", placeholder: "name@company.com" },
        { name: "token", label: "API Secret Key", type: "password", placeholder: "at_xxxxx" }
      ]
    }
  },
  {
    id: "slack",
    name: "Slack Engineering Workspace",
    type: "slack",
    status: "disconnected",
    ingestedCount: 0,
    configSchema: {
      fields: [
        { name: "token", label: "Slack OAuth Bot Token", type: "password", placeholder: "xoxb-xxxx" },
        { name: "channels", label: "Sync Channels", type: "text", placeholder: "#eng-alerts, #ops-incidents" }
      ]
    }
  },
  {
    id: "notion",
    name: "Notion Wiki",
    type: "notion",
    status: "disconnected",
    ingestedCount: 0,
    configSchema: {
      fields: [
        { name: "apiKey", label: "Notion Integration Token", type: "password", placeholder: "secret_xxxxx" },
        { name: "databaseId", label: "Tech Specs Database ID", type: "text", placeholder: "32-character hex ID" }
      ]
    }
  }
];
