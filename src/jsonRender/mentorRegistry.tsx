import { defineRegistry } from '@json-render/react';
import { ArrowRight, CheckCircle2, Flame, HeartHandshake, ShieldAlert, Target } from 'lucide-react';
import { DSAVisualizer } from '../components/DSAVisualizer';
import { mentorCatalog } from './mentorSpec';

const toneStyles = {
  neutral: 'border-white/10 bg-white/[0.03] text-white',
  info: 'border-sky-500/20 bg-sky-500/[0.08] text-sky-50',
  success: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-50',
  warning: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-50',
  danger: 'border-rose-500/20 bg-rose-500/[0.08] text-rose-50',
} as const;

const badgeToneStyles = {
  neutral: 'border-white/10 bg-white/5 text-slate-300',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  danger: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
} as const;

function toneClass(tone: keyof typeof toneStyles | null | undefined) {
  return tone ? toneStyles[tone] : toneStyles.neutral;
}

function badgeToneClass(tone: keyof typeof badgeToneStyles | null | undefined) {
  return tone ? badgeToneStyles[tone] : badgeToneStyles.neutral;
}

function gapClass(gap: 'sm' | 'md' | 'lg' | null | undefined) {
  if (gap === 'sm') return 'gap-3';
  if (gap === 'lg') return 'gap-6';
  return 'gap-4';
}

function heroTheme(emotion: 'calm' | 'focused' | 'energized' | 'proud' | 'caution') {
  if (emotion === 'focused') {
    return {
      shell: 'border-amber-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_50%),linear-gradient(135deg,rgba(31,41,55,0.9),rgba(17,24,39,0.95))]',
      badge: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
      icon: Target,
    };
  }
  if (emotion === 'energized') {
    return {
      shell: 'border-sky-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_50%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(8,47,73,0.92))]',
      badge: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
      icon: Flame,
    };
  }
  if (emotion === 'proud') {
    return {
      shell: 'border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.22),_transparent_50%),linear-gradient(135deg,rgba(6,78,59,0.92),rgba(17,24,39,0.95))]',
      badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
      icon: CheckCircle2,
    };
  }
  if (emotion === 'caution') {
    return {
      shell: 'border-rose-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.18),_transparent_50%),linear-gradient(135deg,rgba(69,10,10,0.95),rgba(17,24,39,0.95))]',
      badge: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
      icon: ShieldAlert,
    };
  }
  return {
    shell: 'border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.15),_transparent_50%),linear-gradient(135deg,rgba(17,24,39,0.92),rgba(15,23,42,0.96))]',
    badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    icon: HeartHandshake,
  };
}

function SectionTitle({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  if (!title && !subtitle) return null;

  return (
    <div className="space-y-1">
      {title ? <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3> : null}
      {subtitle ? <p className="text-xs leading-relaxed text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function renderList(items: string[], ordered: boolean | null | undefined) {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <ListTag className="space-y-2 pl-4 text-xs leading-relaxed text-slate-200">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className={ordered ? 'list-decimal' : 'list-disc'}>
          {item}
        </li>
      ))}
    </ListTag>
  );
}

export const { registry: mentorRegistry } = defineRegistry(mentorCatalog, {
  components: {
    Stack: ({ props, children }) => (
      <section className={`flex flex-col ${gapClass(props.gap)}`}>
        <SectionTitle title={props.title} subtitle={props.subtitle} />
        {children}
      </section>
    ),
    CoachHero: ({ props }) => {
      const theme = heroTheme(props.emotion);
      const Icon = theme.icon;

      return (
        <section className={`overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] ${theme.shell}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.badge}`}>
                  {props.stageLabel}
                </span>
                {props.eyebrow ? <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{props.eyebrow}</span> : null}
              </div>
              <div className="space-y-2">
                <h2 className="max-w-[26ch] text-xl font-semibold leading-tight text-white">{props.headline}</h2>
                <p className="max-w-[34ch] text-sm leading-relaxed text-slate-200">{props.message}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/80">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </section>
      );
    },
    StepRail: ({ props }) => (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="space-y-3">
          <SectionTitle title={props.title} subtitle="See where you are, what is locked in, and what comes next." />
          <div className="space-y-3">
            {props.steps.map((step, index) => {
              const isCurrent = step.status === 'current';
              const isDone = step.status === 'done';
              return (
                <div key={`${index}-${step.title}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isDone
                          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                          : isCurrent
                            ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                            : 'border-white/10 bg-white/5 text-slate-500'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    {index < props.steps.length - 1 ? <div className="mt-2 h-8 w-px bg-white/10" /> : null}
                  </div>
                  <div className="min-w-0 space-y-1 pb-2">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-white' : isDone ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${
                          isDone
                            ? 'bg-emerald-400/10 text-emerald-200'
                            : isCurrent
                              ? 'bg-amber-400/10 text-amber-200'
                              : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    {step.caption ? <p className="text-xs leading-relaxed text-slate-400">{step.caption}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    VisualState: ({ props }) => (
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <SectionTitle title={props.title} subtitle={props.caption} />
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <DSAVisualizer type={props.visualType} data={props.data} />
        </div>
      </section>
    ),
    Card: ({ props, children }) => (
      <section className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm ${toneClass(props.tone)}`}>
        <div className="space-y-3">
          <SectionTitle title={props.title} subtitle={props.description} />
          {children ? <div className="space-y-3">{children}</div> : null}
        </div>
      </section>
    ),
    TextBlock: ({ props }) => (
      <p className={`text-xs leading-relaxed ${props.muted ? 'text-slate-400' : 'text-slate-100'}`}>{props.text}</p>
    ),
    BulletList: ({ props }) => (
      <div className="space-y-2">
        {props.title ? <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{props.title}</p> : null}
        {renderList(props.items, props.ordered)}
      </div>
    ),
    BadgeRow: ({ props }) => (
      <div className="flex flex-wrap gap-2">
        {props.items.map((item, index) => (
          <span
            key={`${index}-${item.label}`}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeToneClass(item.tone)}`}
          >
            {item.label}
          </span>
        ))}
      </div>
    ),
    KeyValueGrid: ({ props }) => (
      <div className="space-y-2">
        {props.title ? <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{props.title}</p> : null}
        <div className="grid grid-cols-1 gap-2">
          {props.items.map((item, index) => (
            <div
              key={`${index}-${item.label}`}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2"
            >
              <span className="text-[10px] font-mono text-slate-400">{item.label}</span>
              <span className="max-w-[180px] truncate text-[11px] font-mono text-slate-100">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    CodeBlock: ({ props }) => (
      <div className="space-y-2">
        {props.title ? <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{props.title}</p> : null}
        <div className="rounded-xl border border-white/5 bg-black/30">
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <span>{props.language || 'logic'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[10px] leading-relaxed text-emerald-300">
          {props.code}
          </pre>
        </div>
      </div>
    ),
  },
});
