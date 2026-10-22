export type KeyStatus = "active" | "stale" | "due";

export interface DemoKey {
  id: string;
  provider: string;
  name: string;
  project: string;
  age: string;
  lastUsed: string;
  spend: string;
  status: KeyStatus;
  accent: string;
}

export const demoKeys: DemoKey[] = [
  {
    id: "key_prod_main",
    provider: "OpenAI",
    name: "prod-main",
    project: "chat-app",
    age: "12d",
    lastUsed: "2m ago",
    spend: "$2,140",
    status: "active",
    accent: "#b9ff4b",
  },
  {
    id: "key_agent_worker",
    provider: "OpenAI",
    name: "agent-worker",
    project: "agents",
    age: "94d",
    lastUsed: "6h ago",
    spend: "$840",
    status: "due",
    accent: "#b9ff4b",
  },
  {
    id: "key_claude_prod",
    provider: "Anthropic",
    name: "claude-prod",
    project: "support",
    age: "31d",
    lastUsed: "18m ago",
    spend: "$690",
    status: "active",
    accent: "#f2b48c",
  },
  {
    id: "key_router_evals",
    provider: "OpenRouter",
    name: "evals",
    project: "benchmarks",
    age: "67d",
    lastUsed: "1d ago",
    spend: "$310",
    status: "stale",
    accent: "#8cc8ff",
  },
  {
    id: "key_gemini_vision",
    provider: "Google AI",
    name: "vision-batch",
    project: "media",
    age: "8d",
    lastUsed: "3h ago",
    spend: "$220",
    status: "active",
    accent: "#9ab8ff",
  },
  {
    id: "key_nvidia_embed",
    provider: "NVIDIA",
    name: "embed-prod",
    project: "search",
    age: "54d",
    lastUsed: "5d ago",
    spend: "$80",
    status: "stale",
    accent: "#9fe870",
  },
];

export const demoConsumers = [
  { name: "Vercel", detail: "production env", status: "synced", meta: "2m ago" },
  { name: "GitHub Actions", detail: "org/repo", status: "synced", meta: "2m ago" },
  { name: ".env.production", detail: "local file", status: "synced", meta: "2m ago" },
  { name: "Supabase", detail: "edge secrets", status: "pending", meta: "not connected" },
];

export const demoRuns = [
  {
    id: "run_7f3a91",
    key: "OPENAI_API_KEY",
    status: "success",
    when: "2m ago",
    detail: "6 steps, 38s",
  },
  {
    id: "run_2b8c40",
    key: "ANTHROPIC_API_KEY",
    status: "success",
    when: "Yesterday",
    detail: "assisted, 2m 14s",
  },
  {
    id: "run_91d7aa",
    key: "OPENROUTER_API_KEY",
    status: "rolled_back",
    when: "3d ago",
    detail: "verify failed, restored",
  },
];

export const rotationSteps = [
  { title: "Preflight", detail: "Manifest and admin token checked" },
  { title: "Escrow old key", detail: "Encrypted locally for rollback" },
  { title: "Create replacement", detail: "OpenAI service-account key" },
  { title: "Write consumers", detail: "Vercel, GitHub, .env.production" },
  { title: "Verify new key", detail: "GET /v1/models returned 200" },
  { title: "Revoke old key", detail: "DELETE /api_keys/key_old" },
];
