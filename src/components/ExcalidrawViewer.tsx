import React from 'react';

interface ExcalidrawViewerProps {
  /** Dynamic Excalidraw elements from the AI response */
  elements?: any[];
  /** Problem slug for fallback context */
  problemSlug?: string;
}

/**
 * Renders Excalidraw diagrams generated dynamically by the AI.
 * The AI watches the user's code and generates elements that visualize
 * the current state of their data structures and algorithm approach.
 */
export default function ExcalidrawViewer({ elements, problemSlug }: ExcalidrawViewerProps) {
  if (!elements || elements.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#55627a', fontSize: 12,
        background: '#0f1117', borderRadius: 10, gap: 8,
      }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>✏️</div>
        <div>AI is watching your code...</div>
        <div style={{ fontSize: 10, color: '#3a4460' }}>
          Start typing and the AI will draw diagrams in real-time
        </div>
      </div>
    );
  }

  // Filter out pseudo-elements for rendering
  const renderableElements = elements.filter(
    (el: any) => el.type !== 'cameraUpdate' && el.type !== 'delete' && el.type !== 'restoreCheckpoint'
  );

  // Find camera settings
  const camera = elements.find((el: any) => el.type === 'cameraUpdate') || {
    x: 0, y: 0, width: 800, height: 600
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#fafafa',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <svg
        viewBox={`${camera.x} ${camera.y} ${camera.width} ${camera.height}`}
        width="100%"
        height="100%"
        style={{ fontFamily: "'Virgil', 'Comic Sans MS', cursive" }}
      >
        <defs>
          <marker id="excl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <filter id="hand-drawn">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="turb" />
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {renderableElements.map((el: any, idx: number) => {
          const key = el.id || `el-${idx}`;

          if (el.type === 'rectangle') {
            return (
              <g key={key}>
                <rect
                  x={el.x} y={el.y}
                  width={el.width} height={el.height}
                  rx={el.roundness?.type === 3 ? 8 : 0}
                  fill={el.backgroundColor || 'transparent'}
                  stroke={el.strokeColor || '#1e1e1e'}
                  strokeWidth={el.strokeWidth || 2}
                  opacity={(el.opacity ?? 100) / 100}
                  style={{ filter: 'url(#hand-drawn)' }}
                />
                {el.label && (
                  <text
                    x={el.x + el.width / 2}
                    y={el.y + el.height / 2 + (el.label.fontSize || 16) * 0.35}
                    textAnchor="middle"
                    fill={el.strokeColor || '#1e1e1e'}
                    fontSize={el.label.fontSize || 16}
                    fontWeight={600}
                  >
                    {el.label.text}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === 'ellipse') {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            return (
              <g key={key}>
                <ellipse
                  cx={cx} cy={cy}
                  rx={el.width / 2} ry={el.height / 2}
                  fill={el.backgroundColor || 'transparent'}
                  stroke={el.strokeColor || '#1e1e1e'}
                  strokeWidth={el.strokeWidth || 2}
                  opacity={(el.opacity ?? 100) / 100}
                  style={{ filter: 'url(#hand-drawn)' }}
                />
                {el.label && (
                  <text
                    x={cx} y={cy + (el.label.fontSize || 16) * 0.35}
                    textAnchor="middle"
                    fill={el.strokeColor || '#1e1e1e'}
                    fontSize={el.label.fontSize || 16}
                    fontWeight={600}
                  >
                    {el.label.text}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === 'diamond') {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const points = `${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`;
            return (
              <g key={key}>
                <polygon
                  points={points}
                  fill={el.backgroundColor || 'transparent'}
                  stroke={el.strokeColor || '#1e1e1e'}
                  strokeWidth={el.strokeWidth || 2}
                  opacity={(el.opacity ?? 100) / 100}
                  style={{ filter: 'url(#hand-drawn)' }}
                />
                {el.label && (
                  <text
                    x={cx} y={cy + (el.label.fontSize || 16) * 0.35}
                    textAnchor="middle"
                    fill={el.strokeColor || '#1e1e1e'}
                    fontSize={el.label.fontSize || 16}
                    fontWeight={600}
                  >
                    {el.label.text}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === 'text') {
            return (
              <text
                key={key}
                x={el.x} y={el.y + (el.fontSize || 16)}
                fill={el.strokeColor || '#1e1e1e'}
                fontSize={el.fontSize || 16}
                fontWeight={el.fontSize && el.fontSize >= 20 ? 700 : 500}
              >
                {el.text}
              </text>
            );
          }

          if (el.type === 'arrow') {
            const points = el.points || [[0, 0], [el.width || 0, el.height || 0]];
            const pathData = points.map((p: number[], i: number) => {
              const cmd = i === 0 ? 'M' : 'L';
              return `${cmd}${el.x + p[0]},${el.y + p[1]}`;
            }).join(' ');

            return (
              <g key={key}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={el.strokeColor || '#1e1e1e'}
                  strokeWidth={el.strokeWidth || 2}
                  strokeDasharray={el.strokeStyle === 'dashed' ? '8,4' : undefined}
                  markerEnd={el.endArrowhead === 'arrow' || el.endArrowhead === 'triangle' ? 'url(#excl-arrow)' : undefined}
                  style={{ filter: 'url(#hand-drawn)' }}
                />
                {el.label && (
                  <text
                    x={el.x + (points[0][0] + points[points.length - 1][0]) / 2}
                    y={el.y + (points[0][1] + points[points.length - 1][1]) / 2 - 8}
                    textAnchor="middle"
                    fill={el.strokeColor || '#757575'}
                    fontSize={el.label.fontSize || 14}
                  >
                    {el.label.text}
                  </text>
                )}
              </g>
            );
          }

          return null;
        })}
      </svg>

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: 6, right: 10,
        fontSize: 9, color: '#b0b0b0', opacity: 0.6,
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        AI-generated · Excalidraw
      </div>
    </div>
  );
}
