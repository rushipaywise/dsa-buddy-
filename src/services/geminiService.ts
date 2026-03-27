import { GoogleGenAI, Type } from "@google/genai";
import type { Spec } from "@json-render/core";
import type { Problem } from "../constants";
import Groq from "groq-sdk";
import { createFallbackMentorSpec, mentorCatalogPrompt, normalizeMentorSpec } from "../jsonRender/mentorSpec";
import { callExcalidrawTool } from "./mcpClient";
import { EXCALIDRAW_INSTRUCTIONS } from '../lib/excalidrawInstructions';

const KEY_STORAGE = "dsa-buddy-runtime-api-keys";

function sanitizeApiKey(value: string | undefined | null) {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed === "your_real_key_here") return "";
  return trimmed;
}

const rawGeminiKey = process.env.GEMINI_API_KEY || "";
const rawGroqKey = process.env.GROQ_API_KEY || "";
const rawMistralKey = process.env.MISTRAL_API_KEY || "";
const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || "";
const envGeminiApiKey = sanitizeApiKey(rawGeminiKey);
const envGroqApiKey = sanitizeApiKey(rawGroqKey);
const envMistralApiKey = sanitizeApiKey(rawMistralKey);
const envOpenRouterApiKey = sanitizeApiKey(rawOpenRouterKey);

let runtimeGeminiApiKey = "";
let runtimeGroqApiKey = "";
let runtimeMistralApiKey = "";
let runtimeOpenRouterApiKey = "";
let runtimePreferredModel = "auto";

if (typeof window !== "undefined") {
  try {
    const stored = window.localStorage.getItem(KEY_STORAGE);
    if (stored) {
      const parsed = JSON.parse(stored) as { geminiKey?: string; groqKey?: string; mistralKey?: string; openRouterKey?: string; preferredModel?: string };
      runtimeGeminiApiKey = sanitizeApiKey(parsed.geminiKey);
      runtimeGroqApiKey = sanitizeApiKey(parsed.groqKey);
      runtimeMistralApiKey = sanitizeApiKey(parsed.mistralKey);
      runtimeOpenRouterApiKey = sanitizeApiKey(parsed.openRouterKey);
      runtimePreferredModel = typeof parsed.preferredModel === "string" && parsed.preferredModel ? parsed.preferredModel : "auto";
    }
  } catch {
    runtimeGeminiApiKey = "";
    runtimeGroqApiKey = "";
    runtimeMistralApiKey = "";
    runtimeOpenRouterApiKey = "";
    runtimePreferredModel = "auto";
  }
}

function effectiveGeminiApiKey() {
  return runtimeGeminiApiKey || envGeminiApiKey;
}

function effectiveGroqApiKey() {
  return runtimeGroqApiKey || envGroqApiKey;
}

function effectiveMistralApiKey() {
  return runtimeMistralApiKey || envMistralApiKey;
}

function effectiveOpenRouterApiKey() {
  return runtimeOpenRouterApiKey || envOpenRouterApiKey;
}

let geminiClientCache: { key: string; client: GoogleGenAI } | null = null;
let groqClientCache: { key: string; client: Groq } | null = null;
let groqRateLimitedUntil = 0;
let geminiRateLimitedUntil = 0;
let mistralRateLimitedUntil = 0;
let openRouterRateLimitedUntil = 0;

function getGeminiClient() {
  const key = effectiveGeminiApiKey();
  if (!key) return null;
  if (geminiClientCache?.key === key) return geminiClientCache.client;
  const client = new GoogleGenAI({ apiKey: key });
  geminiClientCache = { key, client };
  return client;
}

function getGroqClient() {
  const key = effectiveGroqApiKey();
  if (!key) return null;
  if (groqClientCache?.key === key) return groqClientCache.client;
  const client = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
  groqClientCache = { key, client };
  return client;
}

function persistRuntimeKeys() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY_STORAGE,
      JSON.stringify({
        geminiKey: runtimeGeminiApiKey,
        groqKey: runtimeGroqApiKey,
        mistralKey: runtimeMistralApiKey,
        openRouterKey: runtimeOpenRouterApiKey,
        preferredModel: runtimePreferredModel,
      }),
    );
  } catch {}
}

export function setRuntimeApiKeys(keys: { geminiKey?: string; groqKey?: string; mistralKey?: string; openRouterKey?: string }) {
  runtimeGeminiApiKey = sanitizeApiKey(keys.geminiKey);
  runtimeGroqApiKey = sanitizeApiKey(keys.groqKey);
  runtimeMistralApiKey = sanitizeApiKey(keys.mistralKey);
  runtimeOpenRouterApiKey = sanitizeApiKey(keys.openRouterKey);
  geminiClientCache = null;
  groqClientCache = null;
  groqRateLimitedUntil = 0;
  geminiRateLimitedUntil = 0;
  mistralRateLimitedUntil = 0;
  openRouterRateLimitedUntil = 0;
  persistRuntimeKeys();
}

export function getRuntimeApiKeys() {
  return {
    geminiKey: runtimeGeminiApiKey,
    groqKey: runtimeGroqApiKey,
    mistralKey: runtimeMistralApiKey,
    openRouterKey: runtimeOpenRouterApiKey,
    preferredModel: runtimePreferredModel,
  };
}

export function hasConfiguredLiveProvider() {
  return Boolean(effectiveGroqApiKey() || effectiveGeminiApiKey() || effectiveMistralApiKey() || effectiveOpenRouterApiKey());
}

export function setPreferredModel(preferredModel: string) {
  runtimePreferredModel = preferredModel || "auto";
  persistRuntimeKeys();
}

export function getPreferredModel() {
  return runtimePreferredModel;
}

function extractProviderErrorMessage(error: any) {
  if (!error) return "Unknown provider error.";
  const maybeMessage =
    error?.error?.message ||
    error?.message ||
    error?.toString?.() ||
    "Unknown provider error.";
  return String(maybeMessage).slice(0, 220);
}

export async function testLiveProviderConnection() {
  const preferred = runtimePreferredModel || "auto";
  const preferredProvider = preferred === "auto"
    ? "auto"
    : preferred.includes("/")
      ? "openrouter"
      : preferred.split(":")[0];

  if (preferredProvider === "openrouter" && !effectiveOpenRouterApiKey()) {
    return { ok: false, provider: "openrouter", message: "OpenRouter key missing for selected model." };
  }
  if (preferredProvider === "mistral" && !effectiveMistralApiKey()) {
    return { ok: false, provider: "mistral", message: "Mistral key missing for selected model." };
  }

  if (preferred.includes("/") && effectiveOpenRouterApiKey()) {
    if (Date.now() < openRouterRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((openRouterRateLimitedUntil - Date.now()) / 1000));
      return { ok: false, provider: "openrouter", message: `OpenRouter is rate-limited. Retry in ${waitSeconds}s.` };
    }
    try {
      const content = await callOpenRouter(preferred, "Reply with JSON only.", "Return {\"ok\":true}");
      const parsed = safeJsonParse(content);
      return parsed ? { ok: true, provider: "openrouter", message: `OpenRouter model works: ${preferred}` } : { ok: false, provider: "openrouter", message: "OpenRouter returned invalid JSON." };
    } catch (error) {
      return { ok: false, provider: "openrouter", message: `OpenRouter failed: ${extractProviderErrorMessage(error)}` };
    }
  }

  const groq = getGroqClient();
  if (groq && (preferredProvider === "auto" || preferredProvider === "groq")) {
    if (Date.now() < groqRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((groqRateLimitedUntil - Date.now()) / 1000));
      return { ok: false, provider: "groq", message: `Groq is rate-limited. Retry in ${waitSeconds}s.` };
    }
    try {
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Reply exactly with JSON: {\"ok\":true}" }],
        response_format: { type: "json_object" },
      });
      return { ok: true, provider: "groq", message: "Groq key works." };
    } catch (error) {
      return { ok: false, provider: "groq", message: `Groq failed: ${extractProviderErrorMessage(error)}` };
    }
  }

  const ai = getGeminiClient();
  if (ai && (preferredProvider === "auto" || preferredProvider === "gemini")) {
    if (Date.now() < geminiRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((geminiRateLimitedUntil - Date.now()) / 1000));
      return { ok: false, provider: "gemini", message: `Gemini is rate-limited. Retry in ${waitSeconds}s.` };
    }
    try {
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Reply with OK" }] }],
      });
      return { ok: true, provider: "gemini", message: "Gemini key works." };
    } catch (error) {
      return { ok: false, provider: "gemini", message: `Gemini failed: ${extractProviderErrorMessage(error)}` };
    }
  }

  if (effectiveMistralApiKey() && (preferredProvider === "auto" || preferredProvider === "mistral")) {
    if (Date.now() < mistralRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((mistralRateLimitedUntil - Date.now()) / 1000));
      return { ok: false, provider: "mistral", message: `Mistral is rate-limited. Retry in ${waitSeconds}s.` };
    }
    try {
      const content = await callMistral("mistral-small-latest", "Reply with JSON only.", "Return {\"ok\":true}");
      const parsed = safeJsonParse(content);
      return parsed ? { ok: true, provider: "mistral", message: "Mistral key works." } : { ok: false, provider: "mistral", message: "Mistral returned invalid JSON." };
    } catch (error) {
      return { ok: false, provider: "mistral", message: `Mistral failed: ${extractProviderErrorMessage(error)}` };
    }
  }

  return { ok: false, provider: "local", message: "No key configured." };
}

function parseRetryAfterMs(message: string) {
  const minSec = message.match(/in\s+(\d+)m(\d+(?:\.\d+)?)s/i);
  if (minSec) {
    const minutes = Number(minSec[1]);
    const seconds = Number(minSec[2]);
    return Math.max(0, (minutes * 60 + seconds) * 1000);
  }

  const secOnly = message.match(/in\s+(\d+(?:\.\d+)?)s/i);
  if (secOnly) {
    return Math.max(0, Number(secOnly[1]) * 1000);
  }

  return 0;
}

function compactCodeSnippet(code: string, maxLength = 1200) {
  if (code.length <= maxLength) return code;
  return code.slice(code.length - maxLength);
}

async function callOpenRouter(model: string, systemPrompt: string, userPrompt: string) {
  const key = effectiveOpenRouterApiKey();
  if (!key) throw new Error("OpenRouter key missing.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 260)}`);

  const payload = safeJsonParse(text) || {};
  return payload?.choices?.[0]?.message?.content ?? null;
}

async function callMistral(model: string, systemPrompt: string, userPrompt: string) {
  const key = effectiveMistralApiKey();
  if (!key) throw new Error("Mistral key missing.");

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Mistral ${response.status}: ${text.slice(0, 260)}`);

  const payload = safeJsonParse(text) || {};
  return payload?.choices?.[0]?.message?.content ?? null;
}

export interface AIResponse {
  feedback: string;
  hints: string[];
  isCorrect: boolean;
  stage: 'understanding' | 'reasoning' | 'coding' | 'review';
  mentorSpec?: Spec;
  learningGuide?: {
    invariant?: string;
    nextStep?: string;
    pseudocode?: string;
    checkpoints?: string[];
  };
  visualizationData?: any;
  visualType?: string;
  visualData?: any;
  simulationSteps?: any[];
  isQuotaExceeded?: boolean;
  roadmap?: {
    steps: {
      title: string;
      description: string;
      visualState: any;
    }[];
    currentStepIndex: number;
  };
  mistakes?: string[];
  complexity?: { time: string; space: string };
  patternInfo?: {
    name: string;
    description: string;
    relatedProblems: string[];
  };
  excalidrawElements?: any[];
  provider?: 'groq' | 'gemini' | 'mistral' | 'openrouter' | 'local';
  providerStatus?: 'live' | 'fallback';
  providerMessage?: string;
}

function safeJsonParse(raw: string | null | undefined): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

const PATTERN_INFO: Record<string, AIResponse["patternInfo"]> = {
  "Contains Duplicate": {
    name: "Hash Set",
    description: "Track what you have already seen. The moment a value repeats, the answer is decided.",
    relatedProblems: ["Longest Consecutive Sequence", "Happy Number", "Intersection of Two Arrays"],
  },
  "Valid Anagram": {
    name: "Frequency Counting",
    description: "Count characters in one string, then consume the counts with the other string.",
    relatedProblems: ["Group Anagrams", "Find All Anagrams in a String", "Ransom Note"],
  },
  "Two Sum": {
    name: "Complement Lookup",
    description: "For each value x, search for target - x in memory before storing the current value.",
    relatedProblems: ["3Sum", "Two Sum II", "Subarray Sum Equals K"],
  },
  "Group Anagrams": {
    name: "Signature Bucketing",
    description: "Convert each string into a canonical signature, then bucket matching signatures together.",
    relatedProblems: ["Valid Anagram", "Find All Anagrams in a String", "Sort Characters By Frequency"],
  },
  "Top K Frequent Elements": {
    name: "Frequency Then Selection",
    description: "Count first, then use a bucket or heap to pull the strongest frequencies.",
    relatedProblems: ["Kth Largest Element", "Sort Characters By Frequency", "Task Scheduler"],
  },
  "Longest Consecutive Sequence": {
    name: "Set + Sequence Start Detection",
    description: "Only start counting when a number has no predecessor. That prevents duplicate work.",
    relatedProblems: ["Contains Duplicate", "Longest Substring Without Repeating Characters", "Number of Islands"],
  },
};

function getSample(problem: Problem, testData: any) {
  return testData && Object.keys(testData).length > 0 ? testData : problem.sampleData || {};
}

function extractFunctionBody(userCode: string) {
  const start = userCode.indexOf("{");
  const end = userCode.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return userCode.trim();
  return userCode.slice(start + 1, end).trim();
}

function detectFeatures(userCode: string) {
  const body = extractFunctionBody(userCode);
  const setDeclarationMatch = body.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Set\s*\(/);
  const setVarName = setDeclarationMatch?.[1];
  const loopsOverSetVar = setVarName
    ? new RegExp(`for\\s*\\([^)]*\\bof\\s+${setVarName}\\b`).test(body)
    : false;
  const objectLiteralMatch = body.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{\s*\}/);
  const objectVarName = objectLiteralMatch?.[1];
  const loopsOverObjectVar = objectVarName
    ? new RegExp(`for\\s*\\([^)]*\\bof\\s+${objectVarName}\\b`).test(body)
    : false;
  const objectUsesMapMethods = objectVarName
    ? new RegExp(`${objectVarName}\\s*\\.\\s*(?:has|set)\\s*\\(`).test(body)
    : false;
  const hasCommentQuestion = /\/\/.*\?/.test(body) || /\/\*[\s\S]*\?[\s\S]*\*\//.test(body);

  return {
    body,
    hasLogic: body.replace(/\s/g, "").length > 0,
    hasReturn: /\breturn\b/.test(body),
    hasIf: /\bif\s*\(/.test(body),
    usesSet: /new\s+Set|\.\s*has\s*\(|\.\s*add\s*\(/.test(body),
    setVarName,
    loopsOverSetVar,
    objectVarName,
    loopsOverObjectVar,
    objectUsesMapMethods,
    hasCommentQuestion,
    loopsOverNums: /for\s*\([^)]*\bof\s+nums\b/.test(body),
    setHasCheck: /\.\s*has\s*\(/.test(body),
    setAddCall: /\.\s*add\s*\(/.test(body),
    usesMap: /new\s+Map|\.\s*get\s*\(|\.\s*set\s*\(|\[[^\]]+\]\s*=/.test(body),
    usesObjectMap: /Object\.keys|Object\.values|Object\.entries|\{\s*\}/.test(body),
    usesSort: /\.sort\s*\(/.test(body),
    hasNestedLoops: /for\s*\([^)]*\)[\s\S]{0,240}for\s*\(/.test(body),
    usesWhile: /\bwhile\s*\(/.test(body),
    lineCount: body.split("\n").map((line) => line.trim()).filter(Boolean).length,
  };
}

function inferStage(features: ReturnType<typeof detectFeatures>): AIResponse["stage"] {
  if (!features.hasLogic) return "understanding";
  if (!features.hasReturn) return "reasoning";
  if (features.hasNestedLoops) return "coding";
  if (features.usesSet || features.usesMap || features.usesObjectMap || features.usesSort || features.usesWhile) return "review";
  return "coding";
}

function localResponse(problem: Problem, userCode: string, currentStage: string, testData: any, reason: string): AIResponse {
  const features = detectFeatures(userCode);
  const stage = inferStage(features) || (currentStage as AIResponse["stage"]) || "understanding";
  const sample = getSample(problem, testData);
  const patternInfo = PATTERN_INFO[problem.title];
  const problemGuide = (problem as any).guide;

  let feedback = "Focus on the invariant and let each step preserve it.";
  let hints = problem.edgeCases?.slice(0, 3) || (problemGuide?.steps?.slice(0, 3).map((s: any) => s.label) || []);
  let mistakes: string[] = [];
  let complexity: AIResponse["complexity"] = { time: "O(n^2)", space: "O(1)" };
  let learningGuide: AIResponse["learningGuide"] = {
    invariant: "Each step should preserve the meaning of your chosen data structure.",
    nextStep: "Translate the invariant into one loop decision.",
    pseudocode: "",
    checkpoints: [],
  };
  let visualizationData: any = { items: [1, 2, 3], trace: { mode: reason, lines: features.lineCount } };

  switch (problem.title) {
    case "Contains Duplicate": {
      const nums = sample.nums || [1, 2, 3, 1];
      feedback = !features.hasLogic
        ? "Imagine a guard at the door. Each number walks by once; if the guard has seen it before, you are done.\n\n[1] [2] [3] [1]\n ↓   ↓   ↓   !!"
        : features.objectUsesMapMethods || features.loopsOverObjectVar
          ? "No, this is not correct yet. `{}` does not support `.has()` or `.set()`, and `for (.. of hash)` is invalid for a plain object. Use a `Set` and iterate `nums`.\n\nfor (const num of nums)\n  if (seen.has(num)) return true\n  seen.add(num)"
        : features.loopsOverSetVar
          ? "You created the right structure, but your loop is on the set itself. Loop over `nums`, then use the set to check/store.\n\nfor (const num of nums)\n  if (seen.has(num)) return true\n  seen.add(num)"
        : features.usesSet
          ? "This is the right visual: a seen-set growing as numbers arrive. Your next move is to check membership before adding the current number.\n\n[1] -> seen\n[2] -> seen\n[3] -> seen\n[1] -> duplicate"
          : "You are still thinking pairwise, but the invariant is simpler: have I seen this value before? Make the memory structure do the work.\n\nnum -> seen?\n 1  -> no\n 2  -> no\n 3  -> no\n 1  -> yes";
      hints = [
        features.objectUsesMapMethods || features.loopsOverObjectVar
          ? "Replace `let hash = {}` with `const seen = new Set()`."
          : features.loopsOverSetVar
            ? "Loop over `nums`, not the set variable."
            : "Ask a yes-or-no question for each number: have I already seen it?",
        features.objectUsesMapMethods || features.loopsOverObjectVar
          ? "Use `seen.has(num)` and `seen.add(num)`."
          : "A Set gives you O(1) membership checks.",
        features.setHasCheck ? "Now add `seen.add(num)` after the check." : "Check first with `seen.has(num)`, then add.",
      ];
      learningGuide = {
        invariant: "Before processing nums[i], the set contains exactly the values seen in nums[0..i-1].",
        nextStep: features.objectUsesMapMethods || features.loopsOverObjectVar
          ? "Use a Set and this exact structure: `for (const num of nums) { if (seen.has(num)) return true; seen.add(num); }`"
          : features.loopsOverSetVar
          ? "Change the loop to `for (const num of nums)` so each array value is processed once."
          : features.usesSet
          ? "Inside the loop, check `seen.has(num)` before you call `seen.add(num)`."
          : "Create `const seen = new Set()` and loop through `nums` once.",
        pseudocode: `const seen = new Set()
for (const num of nums) {
  if (seen.has(num)) return true
  seen.add(num)
}
return false`,
        checkpoints: [
          "Does the set store past values only?",
          "Do you return immediately on the first repeat?",
          "Do you return false after the loop ends?",
        ],
      };
      mistakes = [
        ...(features.hasNestedLoops ? ["Nested loops solve it, but they hide the real invariant and cost O(n^2)."] : []),
        ...(features.objectUsesMapMethods ? ["`{}` does not have `has/set`. Use `new Set()` or `new Map()`."] : []),
        ...(features.loopsOverObjectVar ? ["`for...of` over a plain object does not work. Iterate `nums` instead."] : []),
        ...(features.loopsOverSetVar ? ["You are iterating the set, so new numbers are never fed into it. Iterate `nums` instead."] : []),
        ...(!features.usesSet && features.hasLogic ? ["A Set is the cleanest structure for this problem."] : []),
        ...(!features.hasReturn && features.hasLogic ? ["You still need an early return the moment a duplicate appears."] : []),
      ];
      complexity = features.usesSet && features.loopsOverNums ? { time: "O(n)", space: "O(n)" } : { time: "O(n^2)", space: "O(1)" };
      visualizationData = {
        items: nums,
        activeIndex: Math.min(3, nums.length - 1),
        seen: features.setAddCall ? nums.slice(0, 3) : [],
        trace: {
          structure: features.usesSet ? "Set" : "Pairwise scan",
          duplicateTarget: nums.find((value: number, index: number) => nums.indexOf(value) !== index) ?? "unknown",
          lines: features.lineCount,
        },
      };
      break;
    }
    case "Two Sum": {
      const nums = sample.nums || [2, 7, 11, 15];
      const target = sample.target ?? 9;
      const activeIndex = Math.min(1, nums.length - 1);
      const complement = target - nums[activeIndex];
      feedback = !features.hasLogic
        ? "See pairs through complements, not brute force. When you are on 7, your eyes should instantly look for 2.\n\nx + y = target\ny = target - x"
        : features.usesMap || features.usesObjectMap
          ? "Good direction. Store what you have seen, and for each number ask whether its complement is already in memory.\n\n7 needs 2\n2 is in map -> answer"
          : "You have not locked the core picture yet: each number points to the value it needs. Build that complement lookup first.\n\n2 -> needs 7\n7 -> found 2";
      hints = [
        "For each number x, compute target - x.",
        "Check whether that complement was seen earlier.",
        "Store value -> index after the check.",
      ];
      learningGuide = {
        invariant: "Before reading nums[i], the map stores every earlier value and the index where you saw it.",
        nextStep: features.usesMap || features.usesObjectMap
          ? "For the current number, compute the complement first. If it exists in the map, return both indices."
          : "Create a map from number to index and process the array once from left to right.",
        pseudocode: `const seen = new Map()
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i]
  if (seen.has(need)) return [seen.get(need), i]
  seen.set(nums[i], i)
}`,
        checkpoints: [
          "Do you check the complement before storing the current value?",
          "Does the map store number -> index?",
          "Are you returning indices, not values?",
        ],
      };
      mistakes = [
        ...(features.hasNestedLoops ? ["Brute force works, but the interview pattern here is complement lookup in a hash map."] : []),
        ...(!(features.usesMap || features.usesObjectMap) && features.hasLogic ? ["Use a map-like structure so lookup becomes O(1)."] : []),
        ...(!features.hasReturn && features.hasLogic ? ["You still need to return the two indices when a complement is found."] : []),
      ];
      complexity = features.usesMap || features.usesObjectMap ? { time: "O(n)", space: "O(n)" } : { time: "O(n^2)", space: "O(1)" };
      visualizationData = {
        items: nums,
        target,
        activeIndex,
        complement,
        map: { [nums[0]]: 0 },
        trace: {
          current: nums[activeIndex],
          complement,
          structure: features.usesMap || features.usesObjectMap ? "Hash map" : "Pair search",
        },
      };
      break;
    }
    case "Valid Anagram": {
      const s = sample.s || "anagram";
      const t = sample.t || "nagaram";
      feedback = !features.hasLogic
        ? "Think in counts, not positions. An anagram is just the same frequency profile seen from two strings.\n\na: ###\nn: #\ng: #"
        : features.usesMap || features.usesObjectMap
          ? "This should feel like filling and draining a bucket of character counts. Build counts with s, then consume them with t."
          : "Do not compare characters one by one in order. Build a frequency picture and compare the whole shape.";
      hints = [
        "Different lengths mean immediate false.",
        "Count characters in the first string.",
        "Decrement counts using the second string and detect underflow.",
      ];
      learningGuide = {
        invariant: "The map represents how many unmatched characters from s are still waiting to be canceled by t.",
        nextStep: /s\.length|t\.length/.test(userCode)
          ? "Build the frequency map for `s`, then consume it with `t`."
          : "Write the length check first. If lengths differ, return false immediately.",
        pseudocode: `if (s.length !== t.length) return false
const count = new Map()
for (const ch of s) count.set(ch, (count.get(ch) || 0) + 1)
for (const ch of t) {
  if (!count.has(ch)) return false
  count.set(ch, count.get(ch) - 1)
  if (count.get(ch) < 0) return false
}
return true`,
        checkpoints: [
          "Did you reject different lengths first?",
          "Can any count go negative?",
          "Does every character from t consume one from s?",
        ],
      };
      mistakes = [
        ...(!/s\.length|t\.length/.test(userCode) && features.hasLogic ? ["Add the length check first. It eliminates bad cases early."] : []),
        ...(!(features.usesMap || features.usesObjectMap) && features.hasLogic ? ["A frequency map is the clearest way to preserve the character counts."] : []),
      ];
      complexity = features.usesMap || features.usesObjectMap ? { time: "O(n)", space: "O(1) to O(n)" } : { time: "O(n log n)", space: "O(n)" };
      visualizationData = {
        map: { a: 3, n: 1, g: 1, r: 1, m: 1 },
        trace: {
          sLength: s.length,
          tLength: t.length,
          structure: features.usesSort ? "Sort compare" : "Frequency map",
        },
      };
      break;
    }
    case "Group Anagrams": {
      const strs = sample.strs || ["eat", "tea", "tan", "ate", "nat", "bat"];
      feedback = !features.hasLogic
        ? "You need a signature for each word so anagrams collapse into the same bucket.\n\neat -> aet\ntea -> aet\nbat -> abt"
        : "Each word should become a stable key, then the map groups matching keys into the same bucket.";
      hints = [
        "Turn each word into a canonical signature.",
        "Use that signature as the map key.",
        "Append the original word into its bucket.",
      ];
      learningGuide = {
        invariant: "Words with the same signature must land in the same bucket.",
        nextStep: "Choose a signature function first, then make the map group by that key.",
        pseudocode: `const groups = new Map()
for (const word of strs) {
  const key = word.split('').sort().join('')
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(word)
}
return Array.from(groups.values())`,
        checkpoints: [
          "Does every anagram share the same key?",
          "Do you append the original word, not the sorted key?",
          "Do you return the grouped values at the end?",
        ],
      };
      mistakes = [
        ...(!(features.usesMap || features.usesObjectMap) && features.hasLogic ? ["Use a map from signature -> list of words."] : []),
        ...(!features.hasReturn && features.hasLogic ? ["Remember to return the map values as grouped arrays."] : []),
      ];
      complexity = features.usesSort ? { time: "O(n * k log k)", space: "O(nk)" } : { time: "O(n * k)", space: "O(nk)" };
      visualizationData = {
        map: { aet: ["eat", "tea", "ate"], ant: ["tan", "nat"], abt: ["bat"] },
        trace: {
          word: strs[0],
          signature: "aet",
          buckets: 3,
        },
      };
      break;
    }
    case "Top K Frequent Elements": {
      const nums = sample.nums || [1, 1, 1, 2, 2, 3];
      feedback = !features.hasLogic
        ? "Break the problem in two pictures: count first, then select the strongest counts.\n\nnums -> frequency map -> top k"
        : "Keep the phases clean: counting and selecting are different jobs. Build the frequencies first, then choose the top k.";
      hints = [
        "Phase 1: build a frequency map.",
        "Phase 2: use buckets or a heap to extract the top k.",
        "Do not mix counting and ranking too early.",
      ];
      learningGuide = {
        invariant: "After counting, frequency lookup should be complete and no longer change while you select the top k.",
        nextStep: "Separate counting from extraction. Finish the frequency map before deciding the top k values.",
        pseudocode: `const freq = new Map()
for (const num of nums) freq.set(num, (freq.get(num) || 0) + 1)
// then bucket by frequency or sort pairs by count
return topKValues`,
        checkpoints: [
          "Did you finish counting before selecting?",
          "Are you choosing by frequency, not numeric value?",
          "Does the result length equal k?",
        ],
      };
      mistakes = [
        ...(!(features.usesMap || features.usesObjectMap) && features.hasLogic ? ["The first phase should be a frequency map."] : []),
      ];
      complexity = features.usesMap || features.usesObjectMap ? { time: "O(n)", space: "O(n)" } : { time: "O(n log n)", space: "O(n)" };
      visualizationData = {
        items: nums,
        trace: {
          phase: features.hasReturn ? "selection" : "counting",
          uniqueValues: new Set(nums).size,
        },
      };
      break;
    }
    case "Longest Consecutive Sequence": {
      const nums = sample.nums || [100, 4, 200, 1, 3, 2];
      feedback = !features.hasLogic
        ? "Do not grow every sequence from every number. Only start counting at true sequence starts.\n\n1 <- start\n2 <- not a start\n3 <- not a start"
        : features.usesSet
          ? "Good instinct. The set lets you ask one critical question: does num - 1 exist? If not, this number starts a sequence."
          : "The invariant is about starts. A number is only worth extending if its predecessor does not exist.";
      hints = [
        "Put all numbers in a set.",
        "Only start counting from numbers whose predecessor is missing.",
        "Extend forward while the next number exists.",
      ];
      learningGuide = {
        invariant: "You only expand a sequence from true starts, so every sequence is counted once.",
        nextStep: features.usesSet
          ? "Write the start-check: only grow the sequence when `num - 1` is not in the set."
          : "Create a set from the numbers first, then scan for sequence starts.",
        pseudocode: `const seen = new Set(nums)
let best = 0
for (const num of seen) {
  if (seen.has(num - 1)) continue
  let length = 1
  while (seen.has(num + length)) length++
  best = Math.max(best, length)
}
return best`,
        checkpoints: [
          "Do you skip numbers that have a predecessor?",
          "Do you extend forward only from starts?",
          "Do you update the best length after each sequence?",
        ],
      };
      mistakes = [
        ...(features.hasNestedLoops ? ["You are doing repeated work. A set should prevent re-scanning the same sequence."] : []),
        ...(!features.usesSet && features.hasLogic ? ["A set is the key structure here."] : []),
      ];
      complexity = features.usesSet ? { time: "O(n)", space: "O(n)" } : { time: "O(n^2)", space: "O(1)" };
      visualizationData = {
        items: nums,
        activeSequence: [1, 2, 3, 4],
        trace: {
          currentStart: 1,
          currentLength: 4,
          structure: features.usesSet ? "Set" : "Repeated scan",
        },
      };
      break;
    }
    default: {
      if (problemGuide?.steps?.length > 0) {
        const firstStep = problemGuide.steps[0];
        feedback = firstStep?.explain || "Let's work through this problem step by step.";
        hints = problemGuide.steps.slice(0, 3).map((s: any) => s.label);
        learningGuide = {
          invariant: "Understand the problem first, then find the key insight.",
          nextStep: problemGuide.steps[1]?.explain || "Look for the optimal approach.",
          pseudocode: "",
          checkpoints: problemGuide.steps.map((s: any) => s.label),
        };
        
        // Find complexity step (usually last)
        const compStep = problemGuide.steps.find((s: any) => s.label.toLowerCase().includes("complexity"));
        if (compStep?.explain) {
          const complexityMatch = compStep.explain.match(/O\([^)]+\)/g);
          if (complexityMatch) {
            complexity = {
              time: complexityMatch[0] || "O(n)",
              space: complexityMatch[1] || "O(1)"
            };
          }
        }
      }
      break;
    }
  }

  const response: AIResponse = {
    feedback,
    hints,
    isCorrect: features.hasReturn && mistakes.length === 0 && stage === "review",
    stage,
    learningGuide,
    visualizationData,
    mistakes,
    complexity,
    patternInfo,
    provider: 'local',
    providerStatus: 'fallback',
    providerMessage: reason === 'quota-fallback'
      ? 'Live provider quota reached, using local coach.'
      : reason === 'connection-fallback'
        ? 'Live provider unavailable, using local coach.'
        : 'Using local coach.',
  };

  response.mentorSpec = createFallbackMentorSpec({
    stage: response.stage,
    problemTitle: problem.title,
    feedback: response.feedback,
    hints: response.hints,
    isCorrect: response.isCorrect,
    roadmap: response.roadmap,
    mistakes: response.mistakes,
    complexity: response.complexity,
    patternInfo: response.patternInfo,
    variableTrace: response.visualizationData?.trace,
    visualType: response.stage === 'understanding' ? 'constraints' : problem.visualType,
    visualData: response.stage === 'understanding'
      ? { constraints: problem.constraints, edgeCases: problem.edgeCases }
      : (response.visualizationData || sample),
    learningGuide: response.learningGuide,
  });

  return response;
}

export function getLocalDSAGuidance(
  problem: Problem,
  userCode: string,
  currentStage: string,
  testData: any,
  reason = "local-live-preview",
): AIResponse {
  return localResponse(problem, userCode, currentStage, testData, reason);
}

function normalizeResponse(
  problem: any,
  response: Partial<AIResponse>,
  currentStage: string,
  providerMeta?: Pick<AIResponse, 'provider' | 'providerStatus' | 'providerMessage'>,
): AIResponse {
  const normalizedStage =
    response.stage && ['understanding', 'reasoning', 'coding', 'review'].includes(response.stage)
      ? response.stage
      : (currentStage as AIResponse['stage']) || 'understanding';

  const fallbackData = {
    stage: normalizedStage,
    problemTitle: problem.title,
    feedback: response.feedback,
    hints: response.hints,
    isCorrect: response.isCorrect,
    complexity: response.complexity,
    patternInfo: response.patternInfo,
    mistakes: response.mistakes,
    variableTrace: response.visualizationData?.trace,
    visualType: normalizedStage === 'understanding' ? 'constraints' : problem.visualType,
    visualData: normalizedStage === 'understanding'
      ? { constraints: problem.constraints, edgeCases: problem.edgeCases }
      : (response.visualizationData || problem.sampleData),
    learningGuide: response.learningGuide,
    roadmap: response.roadmap,
  };

  return {
    feedback: response.feedback || 'Focus on the invariant and keep the state minimal.',
    hints: response.hints || [],
    isCorrect: Boolean(response.isCorrect),
    stage: normalizedStage,
    mentorSpec: normalizeMentorSpec(response.mentorSpec, fallbackData),
    visualizationData: response.visualizationData,
    visualType: normalizedStage === 'understanding' ? 'constraints' : (response.visualType || problem.visualType),
    visualData: normalizedStage === 'understanding'
      ? { constraints: problem.constraints, edgeCases: problem.edgeCases }
      : (response.visualData || response.visualizationData || problem.sampleData),
    simulationSteps: response.simulationSteps,
    isQuotaExceeded: response.isQuotaExceeded,
    roadmap: response.roadmap,
    learningGuide: response.learningGuide,
    mistakes: response.mistakes,
    complexity: response.complexity,
    patternInfo: response.patternInfo,
    excalidrawElements: response.excalidrawElements,
    provider: providerMeta?.provider ?? response.provider ?? 'local',
    providerStatus: providerMeta?.providerStatus ?? response.providerStatus ?? 'fallback',
    providerMessage: providerMeta?.providerMessage ?? response.providerMessage,
  };
}

export async function getDSAGuidance(
  problem: any,
  userCode: string,
  lastAction: string,
  currentStage: string,
  chatHistory: { role: 'user' | 'ai', content: string }[],
  testData: any,
  isLiveKeystroke: boolean = false
): Promise<AIResponse> {
  console.log("🤖 getDSAGuidance called:", { problem: problem.title, lastAction, currentStage });
  console.log("🤖 API Keys check - Groq:", effectiveGroqApiKey() ? "HAS KEY" : "NO KEY", "Gemini:", effectiveGeminiApiKey() ? "HAS KEY" : "NO KEY");
  console.log("🤖 Groq client:", !!getGroqClient(), "Gemini client:", !!getGeminiClient());
  
  const groq = getGroqClient();
  const ai = getGeminiClient();
  let groqFailureReason = '';
  const now = Date.now();
  const preferredModel = runtimePreferredModel || "auto";
  const selectedProvider = preferredModel === "auto"
    ? "auto"
    : preferredModel.includes("/")
      ? "openrouter"
      : preferredModel.split(":")[0];
  const selectedModelName = preferredModel.includes(":") ? preferredModel.split(":")[1] : preferredModel;
  // isLiveKeystroke is now passed as a parameter
  const codeForPrompt = compactCodeSnippet(userCode, isLiveKeystroke ? 2500 : 4000);

  const compactSystemPrompt = `You are "DSA Buddy", a proactive expert mentor. Return JSON ONLY with keys: feedback, hints, isCorrect, stage, visualizationData, mistakes, complexity, patternInfo, excalidrawElements.
  
  PEDAGOGICAL STRATEGY (The 5 Steps):
  You MUST guide the user through these 5 stages in order:
  1. Brute Force: Conceptualize the O(n^2) or naive approach.
  2. Key Insight: Identify the observation (e.g., using a Set) that optimizes the solution.
  3. One Pass: Translate the insight into code (O(n) or optimal).
  4. Example Trace: Walk through a small example to confirm logic.
  5. Complexity: Confirm Time/Space O-notation.

  REAL-TIME WHITEBOARD & CONVERSATION:
  1. If the user asks a question in the code comments (e.g., "// is this correct?"), YOU MUST answer it directly in the 'feedback' string!
  2. Build intuition by DRAWING current state (arrays, pointers, hash maps) in 'excalidrawElements'.
  3. Structure your 'hints' to suggest the NEXT step in the 5-step sequence provided in the Problem Guide below.
  
  EXCALIDRAW INSTRUCTIONS:
  You must format the 'excalidrawElements' array strictly using the following official JSON syntax rules:
  
  ${EXCALIDRAW_INSTRUCTIONS}
  
  If isLiveKeystroke is true, respond IMMEDIATELY with the current state of the user's code.`;

  const guideInfo = problem.guide 
    ? `\n\nProblem Guide Steps (reference for 5-step pedagogy):\n${problem.guide.steps.map((s: any, i: number) => `${i+1}. ${s.label}: ${s.explain}`).join('\n')}` 
    : '';
  
  const guideRequest = lastAction === "get-guide" 
    ? `\n\nURGENT: Generate a COMPLETE 5-step solution guide for this EXACT problem "${problem.title}". 

Return EXACTLY this JSON structure:
{
  "hints": [
    "1. BRUTE FORCE: [explain the O(n^2) naive approach for ${problem.title}]",
    "2. KEY INSIGHT: [explain the key observation that optimizes ${problem.title}]", 
    "3. ONE PASS: [explain the optimal O(n) solution for ${problem.title}]",
    "4. EXAMPLE TRACE: [walk through example input for ${problem.title}]",
    "5. COMPLEXITY: [time and space complexity for ${problem.title}]"
  ],
  "learningGuide": {
    "checkpoints": ["checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "checkpoint5"]
  }
}

Make each hint specific to "${problem.title}" - NOT generic!`
    : '';
  
  const compactUserPrompt = `Problem=${problem.title}; Description=${problem.description || ''}; Difficulty=${problem.difficulty || 'Unknown'}; Stage=${currentStage}; Action=${lastAction}; Code=${codeForPrompt}; Test=${JSON.stringify(testData)}${guideInfo}${guideRequest}`;

  if (selectedProvider === "openrouter") {
    if (!effectiveOpenRouterApiKey()) {
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "connection-fallback");
      local.provider = "local";
      local.providerStatus = "fallback";
      local.providerMessage = "OpenRouter key missing for selected model.";
      return local;
    }
    if (now < openRouterRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((openRouterRateLimitedUntil - now) / 1000));
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "provider-cooldown");
      local.provider = "local";
      local.providerStatus = "fallback";
      local.providerMessage = `OpenRouter rate-limited. Retry in ${waitSeconds}s.`;
      return local;
    }
    try {
      const content = await callOpenRouter(preferredModel, compactSystemPrompt, compactUserPrompt);
      const parsed = safeJsonParse(content);
      if (parsed) {
        return normalizeResponse(problem, parsed, currentStage, {
          provider: 'openrouter',
          providerStatus: 'live',
          providerMessage: `OpenRouter live: ${preferredModel}`,
        });
      }
      throw new Error("OpenRouter returned non-JSON content.");
    } catch (error) {
      const reason = extractProviderErrorMessage(error);
      if (/rate limit|429|quota/i.test(reason)) {
        const retry = parseRetryAfterMs(reason) || 15000;
        openRouterRateLimitedUntil = Date.now() + retry;
      }
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "connection-fallback");
      local.provider = 'local';
      local.providerStatus = 'fallback';
      local.providerMessage = `OpenRouter failed: ${reason}. Switched to local coach.`;
      return local;
    }
  }

  if (selectedProvider === "mistral") {
    if (!effectiveMistralApiKey()) {
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "connection-fallback");
      local.provider = "local";
      local.providerStatus = "fallback";
      local.providerMessage = "Mistral key missing for selected model.";
      return local;
    }
    if (now < mistralRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((mistralRateLimitedUntil - now) / 1000));
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "provider-cooldown");
      local.provider = "local";
      local.providerStatus = "fallback";
      local.providerMessage = `Mistral rate-limited. Retry in ${waitSeconds}s.`;
      return local;
    }
    try {
      const mistralModel = selectedModelName || "mistral-small-latest";
      const content = await callMistral(mistralModel, compactSystemPrompt, compactUserPrompt);
      const parsed = safeJsonParse(content);
      if (parsed) {
        return normalizeResponse(problem, parsed, currentStage, {
          provider: 'mistral',
          providerStatus: 'live',
          providerMessage: `Mistral live: ${mistralModel}`,
        });
      }
      throw new Error("Mistral returned non-JSON content.");
    } catch (error) {
      const reason = extractProviderErrorMessage(error);
      if (/rate limit|429|quota/i.test(reason)) {
        const retry = parseRetryAfterMs(reason) || 15000;
        mistralRateLimitedUntil = Date.now() + retry;
      }
      const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, "connection-fallback");
      local.provider = 'local';
      local.providerStatus = 'fallback';
      local.providerMessage = `Mistral failed: ${reason}. Switched to local coach.`;
      return local;
    }
  }

  if (!groq && !ai) {
    const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, lastAction);
    local.provider = 'local';
    local.providerStatus = 'fallback';
    local.providerMessage = 'No live API key configured.';
    return local;
  }

  // 1. Try Groq FIRST if available
  if (groq && selectedProvider !== "gemini") {
    if (now < groqRateLimitedUntil) {
      const waitSeconds = Math.max(1, Math.ceil((groqRateLimitedUntil - now) / 1000));
      groqFailureReason = `Groq rate-limited. Retry in ${waitSeconds}s.`;
    } else {
    try {
      console.log("Using Groq as primary provider...");
      const groqModel = selectedProvider === "groq" && selectedModelName ? selectedModelName : "llama-3.3-70b-versatile";
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: isLiveKeystroke
              ? compactSystemPrompt
              : `You are "DSA Buddy", a proactive expert mentor.
            Enforce the 5-step strategy: Brute Force -> Key Insight -> One Pass -> Example Trace -> Complexity.
            Structure 'hints' to lead the user to the NEXT logical step in that 5-step guide provided below.
            Answer questions in code comments (e.g. "// why this?") directly in 'feedback'.
            Generate 'excalidrawElements' to visualize the current state of variables and pointers.
            Draw the CURRENT state of the user's code: show arrays with active index, hash maps being built, etc.
            Make diagrams that MATCH what the user's code is doing RIGHT NOW.

            EXCALIDRAW INSTRUCTIONS:
            ${EXCALIDRAW_INSTRUCTIONS}

            JSON Render Catalog:
            ${mentorCatalogPrompt}

            Return ONLY a JSON object matching this schema:
            {
              "feedback": "string (short explanation, ASCII allowed)",
              "hints": ["string"],
              "isCorrect": boolean,
              "stage": "understanding" | "reasoning" | "coding" | "review",
              "mentorSpec": { "root": "string", "elements": {} },
              "visualizationData": object,
              "excalidrawElements": [array of Excalidraw elements showing current code state],
              "patternInfo": { "name": "string", "description": "string", "relatedProblems": ["string"] },
              "mistakes": ["string"],
              "complexity": { "time": "string", "space": "string" }
            }`
          },
          {
            role: "user",
            content: isLiveKeystroke
              ? compactUserPrompt
              : `Problem: ${problem.title}. Description: ${problem.description}. Constraints: ${JSON.stringify(problem.constraints)}. Edge cases: ${JSON.stringify(problem.edgeCases)}. Code: ${codeForPrompt}. Action: ${lastAction}. Stage: ${currentStage}. Test Data: ${JSON.stringify(testData)}. Recent chat: ${JSON.stringify(chatHistory.slice(-4))}.`
          }
        ],
        model: groqModel,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = safeJsonParse(content);
      if (parsed) {
        return normalizeResponse(problem, parsed, currentStage, {
          provider: 'groq',
          providerStatus: 'live',
          providerMessage: 'Groq live coaching active.',
        });
      }
      throw new Error('Groq returned non-JSON content');
    } catch (groqError) {
      console.error("Groq API Error:", groqError);
      groqFailureReason = extractProviderErrorMessage(groqError);
      if (/rate limit|429|rate_limit_exceeded|tokens per day/i.test(groqFailureReason)) {
        const retryMs = parseRetryAfterMs(groqFailureReason) || 10 * 60 * 1000;
        groqRateLimitedUntil = Date.now() + retryMs;
      }
      // If Groq fails, we'll fall through to Gemini
    }
    }
  }

  if (selectedProvider === "groq") {
    const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, 'connection-fallback');
    local.provider = 'local';
    local.providerStatus = 'fallback';
    local.providerMessage = groqFailureReason || 'Selected Groq model failed. Switched to local coach.';
    return local;
  }

  if (!ai) {
    const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, 'connection-fallback');
    local.provider = 'local';
    local.providerStatus = 'fallback';
    local.providerMessage = selectedProvider === "gemini"
      ? "Selected Gemini model, but Gemini key is missing."
      : groqFailureReason
        ? `Groq failed: ${groqFailureReason}. Gemini key missing. Using local coach.`
        : 'Groq failed and Gemini key is missing. Using local coach.';
    return local;
  }

  if (now < geminiRateLimitedUntil) {
    const waitSeconds = Math.max(1, Math.ceil((geminiRateLimitedUntil - now) / 1000));
    const local = getLocalDSAGuidance(problem, userCode, currentStage, testData, 'provider-cooldown');
    local.provider = 'local';
    local.providerStatus = 'fallback';
    local.providerMessage = `Gemini rate-limited. Retry in ${waitSeconds}s.`;
    return local;
  }

  // Define MCP tools for Gemini
  const mcpTools: any[] = [{
    functionDeclarations: [{
      name: "create_view",
      description: "Draws a diagram using Excalidraw elements. Call this to visually explain data structures or algorithm steps.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          elements: {
            type: Type.STRING,
            description: "JSON array string of Excalidraw elements (rectangles, arrows, etc.)"
          }
        },
        required: ["elements"]
      }
    }]
  }];

  // 2. Fallback to Gemini if Groq is not available or failed
  try {
    const geminiModel = selectedProvider === "gemini" && selectedModelName ? selectedModelName : "gemini-1.5-flash";
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: isLiveKeystroke
                ? `${compactSystemPrompt}\n${compactUserPrompt}`
                : `You are "DSA Buddy", a proactive and highly interactive expert mentor.
              The user is working on: "${problem.title}".

              CRITICAL: You are watching the user type in REAL-TIME.
              This app exists to build DSA intuition, not just to spit out answers.
              The user should be able to understand the next move by looking at the UI.
              Use ONLY ASCII art/diagrams in your 'feedback' to explain concepts.
              Generate a visual json-render spec in 'mentorSpec' for the mentor panel.
              Add human warmth and momentum, but stay technically precise.
              Draw the CURRENT state of the user's code: show arrays with active index, hash maps being built, pointers moving, etc.
              Make diagrams that MATCH what the user's code is doing RIGHT NOW.
              
              THE 5-STEP PEDAGOGY:
              1. Brute Force
              2. Key Insight
              3. One Pass (Optimization)
              4. Example Trace
              5. Complexity (Time/Space)
              
              Always identify which step the user is on and provide hints for the NEXT one.

              Return JSON matching the schema.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            hints: { type: Type.ARRAY, items: { type: Type.STRING } },
            isCorrect: { type: Type.BOOLEAN },
            stage: { type: Type.STRING, enum: ['understanding', 'reasoning', 'coding', 'review'] },
            mentorSpec: { type: Type.OBJECT },
            visualizationData: { type: Type.OBJECT },
            patternInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                relatedProblems: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            complexity: { 
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                space: { type: Type.STRING }
              }
            },
            excalidrawElements: { type: Type.ARRAY, items: { type: Type.OBJECT } }
          },
          required: ["feedback", "hints", "isCorrect", "stage"]
        }
      }
    });

    return normalizeResponse(problem, safeJsonParse(response.text) || {}, currentStage, {
      provider: 'gemini',
      providerStatus: 'live',
      providerMessage: `Gemini live coaching active (${geminiModel}).`,
    });
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    const geminiFailureReason = extractProviderErrorMessage(e);
    
    // Improved quota error detection
    const errorStr = JSON.stringify(e);
    const isQuotaError = 
      errorStr.includes("quota") || 
      errorStr.includes("429") || 
      e?.message?.includes("quota") || 
      e?.message?.includes("429") ||
      e?.status === "RESOURCE_EXHAUSTED" ||
      e?.error?.status === "RESOURCE_EXHAUSTED" ||
      e?.error?.code === 429;
    if (isQuotaError) {
      const retryMs = parseRetryAfterMs(errorStr) || 15000;
      geminiRateLimitedUntil = Date.now() + retryMs;
    }

    const staticRoadmaps: Record<string, any> = {
      "Two Sum": {
        steps: [
          {
            title: "1. The Complement Concept",
            description: "For every number 'x', we are looking for 'y' such that x + y = target. This means y = target - x.",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 0, complement: 7 }
          },
          {
            title: "2. Memory for Speed",
            description: "Instead of nested loops (O(n²)), we use a Hash Map to remember numbers we've already seen.",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 1, map: { "2": 0 } }
          },
          {
            title: "3. The Instant Match",
            description: "When we reach 7, we check if its complement (2) is in our map. It is! We return [0, 1].",
            visualState: { items: [2, 7, 11, 15], target: 9, activeIndex: 1, found: [0, 1] }
          }
        ],
        currentStepIndex: 0
      },
      "Contains Duplicate": {
        steps: [
          {
            title: "1. Tracking Uniqueness",
            description: "We need a way to track numbers we've seen. A Hash Set is perfect for O(1) lookups.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 0, set: [] }
          },
          {
            title: "2. Building the Set",
            description: "As we iterate, we add each number to the set if it's not already there.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 2, set: [1, 2, 3] }
          },
          {
            title: "3. Detecting the Duplicate",
            description: "When we see '1' again, we check the set. It's already there! Return true.",
            visualState: { items: [1, 2, 3, 1], activeIndex: 3, duplicateFound: 1 }
          }
        ],
        currentStepIndex: 0
      },
      "Valid Anagram": {
        steps: [
          {
            title: "1. Length Check",
            description: "If the strings have different lengths, they can't be anagrams. Immediate exit.",
            visualState: { s: "anagram", t: "nagaram", lengthMatch: true }
          },
          {
            title: "2. Frequency Counting",
            description: "Count the occurrences of each character in string 's' using a Hash Map.",
            visualState: { map: { a: 3, n: 1, g: 1, r: 1, m: 1 } }
          },
          {
            title: "3. Verification",
            description: "Decrement counts using string 't'. If all counts hit zero, it's a valid anagram.",
            visualState: { map: { a: 0, n: 0, g: 0, r: 0, m: 0 }, isValid: true }
          }
        ],
        currentStepIndex: 0
      }
    };

    const fallbackResponse = getLocalDSAGuidance(problem, userCode, currentStage, testData, isQuotaError ? "quota-fallback" : "connection-fallback");
    fallbackResponse.isQuotaExceeded = isQuotaError;
    fallbackResponse.provider = 'local';
    fallbackResponse.providerStatus = 'fallback';
    fallbackResponse.providerMessage = isQuotaError
      ? 'Live provider quota reached. Switched to local coach.'
      : groqFailureReason
        ? `Groq failed: ${groqFailureReason}. Gemini failed: ${geminiFailureReason}. Switched to local coach.`
        : `Live provider request failed: ${geminiFailureReason}. Switched to local coach.`;
    fallbackResponse.roadmap = staticRoadmaps[problem.title] || {
      steps: [
        {
          title: "Step 1: Analyze Input",
          description: "Look at the constraints and identify the core data structure needed.",
          visualState: { items: [1, 2, 3], stage: 'analysis' }
        },
        {
          title: "Step 2: Define Logic",
          description: "Plan your traversal and how you will handle each element.",
          visualState: { items: [1, 2, 3], stage: 'logic' }
        }
      ],
      currentStepIndex: 0
    };
    fallbackResponse.mentorSpec = createFallbackMentorSpec({
      stage: fallbackResponse.stage,
      problemTitle: problem.title,
      feedback: fallbackResponse.feedback,
      hints: fallbackResponse.hints,
      isCorrect: fallbackResponse.isCorrect,
      roadmap: fallbackResponse.roadmap,
      mistakes: fallbackResponse.mistakes,
      complexity: fallbackResponse.complexity,
      patternInfo: fallbackResponse.patternInfo,
      variableTrace: fallbackResponse.visualizationData?.trace,
      visualType: fallbackResponse.stage === 'understanding' ? 'constraints' : problem.visualType,
      visualData: fallbackResponse.stage === 'understanding'
        ? { constraints: problem.constraints, edgeCases: problem.edgeCases }
        : (fallbackResponse.visualizationData || problem.sampleData),
      learningGuide: fallbackResponse.learningGuide,
    });
    return fallbackResponse;
  }
}
