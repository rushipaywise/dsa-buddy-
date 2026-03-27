import React from 'react';

interface VisualizerProps {
  type: 'array' | 'hashmap' | 'set' | 'grid' | 'sequence' | 'constraints';
  data: any;
}

function Cell({
  value,
  index,
  active = false,
  muted = false,
}: {
  value: React.ReactNode;
  index?: number;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-16 w-16 items-center justify-center border-2 text-2xl font-semibold transition-all ${
          active
            ? 'border-amber-400 bg-amber-400/15 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.25)]'
            : muted
              ? 'border-white/10 bg-white/[0.03] text-slate-500'
              : 'border-slate-300 bg-[#f2f2f2] text-slate-900'
        }`}
      >
        {value}
      </div>
      {index !== undefined ? <span className="text-xl font-bold text-rose-500">{index}</span> : null}
    </div>
  );
}

function ArrayStrip({
  items,
  activeIndex,
  mutedIndexes = [],
}: {
  items: any[];
  activeIndex?: number;
  mutedIndexes?: number[];
}) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-0">
      {items.map((item, index) => (
        <Cell
          key={`${index}-${String(item)}`}
          value={item}
          index={index}
          active={activeIndex === index}
          muted={mutedIndexes.includes(index)}
        />
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function renderHashRows(entries: Array<[string, any]>) {
  if (entries.length === 0) {
    return <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">Map is empty</div>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <div className="flex h-11 min-w-[72px] items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 text-sm font-semibold text-sky-100">
            {key}
          </div>
          <div className="text-slate-500">→</div>
          <div className="flex h-11 min-w-[88px] items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100">
            {Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderConstraints(data: any) {
  const constraints = data.constraints || [];
  const edgeCases = data.edgeCases || [];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Panel title="Constraints">
        <div className="space-y-2">
          {constraints.map((item: string) => (
            <div key={item} className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-100">
              {item}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Edge Cases">
        <div className="space-y-2">
          {edgeCases.map((item: string) => (
            <div key={item} className="rounded-xl border border-amber-400/10 bg-amber-400/5 px-3 py-2 text-xs text-amber-100">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function renderGrid(board: any[][]) {
  return (
    <div className="flex justify-center">
      <div className="grid gap-1 rounded-2xl border border-white/10 bg-black/20 p-2" style={{ gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))` }}>
        {board.flatMap((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <div
              key={`${rowIndex}-${cellIndex}`}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-semibold text-white"
            >
              {cell}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export const DSAVisualizer: React.FC<VisualizerProps> = ({ type, data }) => {
  if (!data) return null;

  if (type === 'constraints') {
    return <div className="h-full overflow-auto p-4">{renderConstraints(data)}</div>;
  }

  if (type === 'grid') {
    return <div className="h-full overflow-auto p-4">{renderGrid(data.board || [])}</div>;
  }

  if (type === 'array') {
    const items = Array.isArray(data) ? data : data.items || [];
    return (
      <div className="flex h-full flex-col justify-center gap-4 p-6">
        <ArrayStrip items={items} activeIndex={data.activeIndex ?? data.currentIndex} />
        {data.complement !== undefined || data.target !== undefined ? (
          <div className="mx-auto flex flex-wrap justify-center gap-2 text-xs">
            {data.target !== undefined ? <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-200">target: {data.target}</span> : null}
            {data.complement !== undefined ? <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-200">need: {data.complement}</span> : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === 'set') {
    const items = Array.isArray(data) ? data : data.items || [];
    const seen = data.seen || [];

    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6">
        <Panel title="Input Stream">
          <ArrayStrip items={items} activeIndex={data.activeIndex ?? data.currentIndex} />
        </Panel>
        <Panel title="Seen Set">
          <div className="flex flex-wrap justify-center gap-2">
            {seen.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-slate-500">Nothing stored yet</div>
            ) : (
              seen.map((value: any, index: number) => (
                <div key={`${index}-${String(value)}`} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                  {value}
                </div>
              ))
            )}
          </div>
        </Panel>
        {data.trace?.duplicateTarget ? (
          <div className="mx-auto rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-200">
            duplicate spotted: {data.trace.duplicateTarget}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === 'hashmap') {
    const items = data.items || [];
    const entries = Object.entries(data.map || {});

    return (
      <div className="flex h-full flex-col gap-4 p-5">
        {items.length ? (
          <Panel title="Array View">
            <ArrayStrip items={items} activeIndex={data.activeIndex ?? data.currentIndex} />
          </Panel>
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Hash Map">
            {renderHashRows(entries)}
          </Panel>
          <Panel title="Current Focus">
            <div className="space-y-2 text-sm">
              {data.target !== undefined ? <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sky-100">target: {data.target}</div> : null}
              {data.trace?.current !== undefined ? <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white">current: {String(data.trace.current)}</div> : null}
              {data.complement !== undefined ? <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-amber-100">need: {data.complement}</div> : null}
              {data.trace?.signature ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100">signature: {data.trace.signature}</div> : null}
              {!data.target && data.trace?.current === undefined && data.complement === undefined && !data.trace?.signature ? (
                <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-slate-500">Waiting for current snapshot</div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (type === 'sequence') {
    const items = data.items || [];
    const activeSequence = data.activeSequence || [];
    const mutedIndexes = items
      .map((value: any, index: number) => (activeSequence.includes(value) ? -1 : index))
      .filter((index: number) => index !== -1);

    return (
      <div className="flex h-full flex-col justify-center gap-5 p-6">
        <Panel title="Sequence Scan">
          <ArrayStrip items={items} mutedIndexes={mutedIndexes} />
        </Panel>
        <Panel title="Current Streak">
          <div className="flex flex-wrap justify-center gap-2">
            {activeSequence.map((value: any, index: number) => (
              <div key={`${index}-${String(value)}`} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                {value}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-4 text-xs text-slate-500">
      No visual available
    </div>
  );
};
