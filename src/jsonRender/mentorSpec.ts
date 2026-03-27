import { autoFixSpec, defineCatalog, type Spec, validateSpec } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

const toneSchema = z.enum(['neutral', 'info', 'success', 'warning', 'danger']);
const emotionSchema = z.enum(['calm', 'focused', 'energized', 'proud', 'caution']);
const stepStatusSchema = z.enum(['done', 'current', 'next']);

export const mentorCatalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({
        title: z.string().nullable(),
        subtitle: z.string().nullable(),
        gap: z.enum(['sm', 'md', 'lg']).nullable(),
      }),
      description: 'A vertical layout container for mentor sections.',
    },
    CoachHero: {
      props: z.object({
        eyebrow: z.string().nullable(),
        headline: z.string(),
        message: z.string(),
        emotion: emotionSchema,
        stageLabel: z.string(),
      }),
      description: 'A visually strong coaching banner that feels human, encouraging, and focused.',
    },
    StepRail: {
      props: z.object({
        title: z.string().nullable(),
        steps: z.array(
          z.object({
            title: z.string(),
            caption: z.string().nullable(),
            status: stepStatusSchema,
          }),
        ),
      }),
      description: 'A visual learning path showing progress through understanding, reasoning, coding, and review.',
    },
    VisualState: {
      props: z.object({
        title: z.string().nullable(),
        caption: z.string().nullable(),
        visualType: z.enum(['array', 'hashmap', 'set', 'grid', 'sequence', 'constraints']),
        data: z.any(),
      }),
      description: 'A visual state panel for the current algorithm snapshot.',
    },
    Card: {
      props: z.object({
        title: z.string(),
        tone: toneSchema.nullable(),
        description: z.string().nullable(),
      }),
      description: 'A framed section card with a short title and optional description.',
    },
    TextBlock: {
      props: z.object({
        text: z.string(),
        muted: z.boolean().nullable(),
      }),
      description: 'A concise paragraph of guidance text.',
    },
    BulletList: {
      props: z.object({
        title: z.string().nullable(),
        items: z.array(z.string()),
        ordered: z.boolean().nullable(),
      }),
      description: 'A short ordered or unordered list for hints, mistakes, or steps.',
    },
    BadgeRow: {
      props: z.object({
        items: z.array(
          z.object({
            label: z.string(),
            tone: toneSchema.nullable(),
          }),
        ),
      }),
      description: 'A row of compact status badges.',
    },
    KeyValueGrid: {
      props: z.object({
        title: z.string().nullable(),
        items: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        ),
      }),
      description: 'A compact grid of labeled values for complexity or variable trace.',
    },
    CodeBlock: {
      props: z.object({
        title: z.string().nullable(),
        code: z.string(),
        language: z.string().nullable(),
      }),
      description: 'A compact monospace block for ASCII diagrams, traces, or pseudocode.',
    },
  },
  actions: {},
});

export interface MentorSpecData {
  stage: 'understanding' | 'reasoning' | 'coding' | 'review';
  problemTitle: string;
  feedback?: string;
  hints?: string[];
  isCorrect?: boolean;
  complexity?: { time?: string; space?: string };
  patternInfo?: {
    name?: string;
    description?: string;
    relatedProblems?: string[];
  };
  mistakes?: string[];
  variableTrace?: Record<string, unknown>;
  visualType?: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence' | 'constraints';
  visualData?: unknown;
  learningGuide?: {
    invariant?: string;
    nextStep?: string;
    pseudocode?: string;
    checkpoints?: string[];
  };
  roadmap?: {
    steps?: Array<{
      title?: string;
      description?: string;
    }>;
  };
}

export const mentorCatalogPrompt = mentorCatalog.prompt({
  system: 'You are generating a visual, human DSA coaching UI for a live tutoring panel.',
  customRules: [
    'Return a flat spec with a string root key and an elements object.',
    'Use only the catalog components exactly as defined.',
    'Teach by making the user see the idea. Prefer visual scaffolding over dense prose.',
    'Usually include VisualState, CoachHero, StepRail, then 2 to 4 support cards.',
    'Keep the UI compact but vivid: usually 4 to 7 top-level elements.',
    'Prefer concise copy. Each text block should be at most 2 short sentences.',
    'Use second-person language and sound like a calm but invested human coach.',
    'Always include one concrete next action and one intuition-building insight.',
    'Use CodeBlock only for ASCII diagrams, pseudocode, or small traces.',
    'Use KeyValueGrid for complexity or variable snapshots.',
    'Use BulletList for hints, mistakes, related problems, or step lists.',
  ],
});

function stageIndex(stage: MentorSpecData['stage']) {
  return ['understanding', 'reasoning', 'coding', 'review'].indexOf(stage);
}

function stageLabel(stage: MentorSpecData['stage']) {
  if (stage === 'understanding') return 'Understanding';
  if (stage === 'reasoning') return 'Reasoning';
  if (stage === 'coding') return 'Coding';
  return 'Review';
}

function getEmotion(data: MentorSpecData) {
  if (data.mistakes?.length) return 'caution' as const;
  if (data.isCorrect && data.stage === 'review') return 'proud' as const;
  if (data.stage === 'coding') return 'energized' as const;
  if (data.stage === 'reasoning') return 'focused' as const;
  return 'calm' as const;
}

function buildStageSteps(stage: MentorSpecData['stage']) {
  const currentIndex = stageIndex(stage);
  return [
    {
      title: 'Understand the shape',
      caption: 'See the input, output, and constraints.',
      status: currentIndex > 0 ? 'done' : currentIndex === 0 ? 'current' : 'next',
    },
    {
      title: 'Lock the invariant',
      caption: 'Pick the pattern and what must stay true.',
      status: currentIndex > 1 ? 'done' : currentIndex === 1 ? 'current' : 'next',
    },
    {
      title: 'Translate into moves',
      caption: 'Turn the idea into loop-by-loop decisions.',
      status: currentIndex > 2 ? 'done' : currentIndex === 2 ? 'current' : 'next',
    },
    {
      title: 'Stress test the solution',
      caption: 'Check edge cases, complexity, and correctness.',
      status: currentIndex === 3 ? 'current' : currentIndex > 3 ? 'done' : 'next',
    },
  ];
}

function coachHeadline(data: MentorSpecData) {
  if (data.isCorrect && data.stage === 'review') {
    return 'You have the shape. Now make it feel inevitable.';
  }
  if (data.mistakes?.length) {
    return 'You are close. Slow down and fix the invariant.';
  }
  if (data.stage === 'coding') {
    return 'The idea is there. Now encode it without losing the pattern.';
  }
  if (data.stage === 'reasoning') {
    return 'This is the thinking moment. See the move before you write it.';
  }
  return 'Build the mental picture first. Code comes after clarity.';
}

function coachMessage(data: MentorSpecData) {
  const narrative = extractNarrative(data.feedback);
  if (narrative) {
    const firstSentence = narrative.split('. ').slice(0, 1).join('. ');
    return firstSentence.length > 120 ? `${firstSentence.slice(0, 117).trim()}...` : firstSentence;
  }
  if (data.stage === 'coding') return 'Protect the invariant on every loop.';
  if (data.stage === 'reasoning') return 'Lock the pattern before you code.';
  return 'See the relationship before writing lines.';
}

function summarizeTrace(trace: Record<string, unknown> | undefined) {
  if (!trace) return [];

  return Object.entries(trace)
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value:
        value === null
          ? 'null'
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value),
    }));
}

function extractAsciiBlock(text: string | undefined) {
  if (!text) return null;
  const lines = text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const asciiLines = lines.filter((line) => /[\[\]\-\>\<\=\|]/.test(line));
  if (asciiLines.length === 0) return null;
  return asciiLines.join('\n');
}

function extractNarrative(text: string | undefined) {
  if (!text) return '';

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[\[\]\-\>\<\=\| ]+$/.test(line))
    .join(' ')
    .trim();
}

export function createFallbackMentorSpec(data: MentorSpecData): Spec {
  const root = 'mentor-root';
  const elements: Spec['elements'] = {};
  const children: string[] = [];
  let cardIndex = 0;
  const emotion = getEmotion(data);

  const pushCard = (
    title: string,
    tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger',
    description?: string | null,
    buildChildren?: (cardKey: string) => string[],
  ) => {
    const cardKey = `card-${cardIndex++}`;
    const cardChildren = buildChildren ? buildChildren(cardKey) : [];
    elements[cardKey] = {
      type: 'Card',
      props: {
        title,
        tone,
        description: description ?? null,
      },
      children: cardChildren,
    };
    children.push(cardKey);
  };

  const stageTone =
    data.stage === 'review'
      ? 'success'
      : data.stage === 'coding'
        ? 'info'
        : data.stage === 'reasoning'
          ? 'warning'
          : 'neutral';

  elements['hero'] = {
    type: 'CoachHero',
    props: {
      eyebrow: data.patternInfo?.name ?? stageLabel(data.stage),
      headline: coachHeadline(data),
      message: coachMessage(data),
      emotion,
      stageLabel: `${stageLabel(data.stage)} mode`,
    },
    children: [],
  };

  if (data.visualType && data.visualData) {
    elements['visual-state'] = {
      type: 'VisualState',
      props: {
        title: null,
        caption: null,
        visualType: data.visualType,
        data: data.visualData,
      },
      children: [],
    };
    children.push('visual-state');
  }

  children.push('hero');

  const stageSteps = buildStageSteps(data.stage);
  elements['step-rail'] = {
    type: 'StepRail',
    props: {
      title: 'Learning Path',
      steps: stageSteps,
    },
    children: [],
  };
  children.push('step-rail');

  if (data.learningGuide?.invariant || data.learningGuide?.nextStep || data.learningGuide?.pseudocode) {
    pushCard('Write Next', 'success', null, (cardKey) => {
      const blockKeys: string[] = [];

      if (data.learningGuide?.invariant) {
        const invariantKey = `${cardKey}-invariant`;
        elements[invariantKey] = {
          type: 'TextBlock',
          props: {
            text: `Invariant: ${data.learningGuide.invariant}`,
            muted: false,
          },
          children: [],
        };
        blockKeys.push(invariantKey);
      }

      if (data.learningGuide?.nextStep) {
        const nextKey = `${cardKey}-next`;
        elements[nextKey] = {
          type: 'TextBlock',
          props: {
            text: `Next step: ${data.learningGuide.nextStep}`,
            muted: false,
          },
          children: [],
        };
        blockKeys.push(nextKey);
      }

      if (data.learningGuide?.pseudocode) {
        const codeKey = `${cardKey}-pseudo`;
        elements[codeKey] = {
          type: 'CodeBlock',
          props: {
            title: 'Pseudocode',
            code: data.learningGuide.pseudocode,
            language: 'guide',
          },
          children: [],
        };
        blockKeys.push(codeKey);
      }

      return blockKeys;
    });
  }

  const issueItems = data.mistakes?.length ? data.mistakes : data.learningGuide?.checkpoints;
  const uniqueIssueItems = issueItems ? Array.from(new Set(issueItems)) : [];
  if (uniqueIssueItems.length) {
    pushCard(data.mistakes?.length ? 'Watch Outs' : 'Checks', data.mistakes?.length ? 'danger' : 'neutral', null, (cardKey) => {
      const listKey = `${cardKey}-list`;
      elements[listKey] = {
        type: 'BulletList',
        props: {
          title: null,
          items: uniqueIssueItems.slice(0, 3),
          ordered: false,
        },
        children: [],
      };
      return [listKey];
    });
  }

  elements[root] = {
    type: 'Stack',
    props: {
      title: null,
      subtitle: null,
      gap: 'md',
    },
    children,
  };

  return { root, elements };
}

export function normalizeMentorSpec(spec: Spec | null | undefined, fallbackData: MentorSpecData): Spec {
  if (!spec || typeof spec !== 'object') {
    return createFallbackMentorSpec(fallbackData);
  }

  const fixed = autoFixSpec(spec as Spec).spec;
  const validation = validateSpec(fixed);
  if (!validation.valid) {
    return createFallbackMentorSpec(fallbackData);
  }

  return fixed;
}

export function upsertVisualState(
  spec: Spec,
  visualType: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence' | 'constraints',
  visualData: unknown,
): Spec {
  const visualKey = '__visual_state__';
  const nextSpec: Spec = {
    ...spec,
    elements: { ...spec.elements },
  };

  const existingVisualKeys = Object.entries(nextSpec.elements)
    .filter(([, element]) => (element as any)?.type === 'VisualState')
    .map(([key]) => key);

  const blockedKeys = new Set([...existingVisualKeys, visualKey]);

  for (const key of existingVisualKeys) {
    delete (nextSpec.elements as any)[key];
  }

  for (const [key, element] of Object.entries(nextSpec.elements)) {
    const children = Array.isArray((element as any)?.children) ? (element as any).children : [];
    (nextSpec.elements as any)[key] = {
      ...(element as any),
      children: children.filter((child: string) => !blockedKeys.has(child)),
    };
  }

  (nextSpec.elements as any)[visualKey] = {
    type: 'VisualState',
    props: {
      title: null,
      caption: null,
      visualType,
      data: visualData,
    },
    children: [],
  };

  const rootKey = nextSpec.root;
  const rootElement = (nextSpec.elements as any)[rootKey];

  if (!rootElement) return nextSpec;

  const existingChildren = Array.isArray(rootElement.children) ? rootElement.children : [];
  const filteredChildren = existingChildren.filter((child: string) => !blockedKeys.has(child));

  (nextSpec.elements as any)[rootKey] = {
    ...rootElement,
    children: [visualKey, ...filteredChildren],
  };

  return nextSpec;
}
