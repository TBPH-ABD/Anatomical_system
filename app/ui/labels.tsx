import {useMemo} from 'react';
import type {SceneLabel} from '../scene';

interface Props {
  labels: SceneLabel[];
  nameFor: (index: number) => string;
  width: number;
  height: number;
}

interface Placed extends SceneLabel {
  name: string;
  side: 'start' | 'end';
  textY: number;
}

const ROW = 26;
const MARGIN = 14;

/** Leader lines cannot cross because each side keeps the anchors in their
 * original vertical order and only pushes them apart to the minimum row gap. */
function stack(items: (SceneLabel & {name: string})[], top: number, bottom: number, side: 'start' | 'end'): Placed[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const placed: Placed[] = [];
  let cursor = top;
  for (const item of sorted) {
    const textY = Math.max(cursor, item.y);
    cursor = textY + ROW;
    placed.push({...item, side, textY});
  }
  // A column that overflowed the viewport is lifted back into it as a block,
  // which preserves the order and therefore the no-crossing guarantee.
  const overflow = cursor - ROW - bottom;
  if (overflow > 0) for (const item of placed) item.textY -= overflow;
  return placed;
}

export function LabelLayer({labels, nameFor, width, height}: Props) {
  const placed = useMemo(() => {
    if (!labels.length || !width || !height) return [];
    const named = labels.map((label) => ({...label, name: nameFor(label.index)})).filter((label) => label.name);
    const middle = width / 2;
    return [
      ...stack(named.filter((label) => label.x < middle), MARGIN, height - MARGIN, 'start'),
      ...stack(named.filter((label) => label.x >= middle), MARGIN, height - MARGIN, 'end'),
    ];
  }, [labels, nameFor, width, height]);

  if (!placed.length) return null;
  return (
    <div className="label-layer" aria-hidden="true">
      <svg width={width} height={height} className="label-lines">
        {placed.map((label) => {
          const anchorX = label.side === 'start' ? MARGIN + 150 : width - MARGIN - 150;
          return (
            <polyline
              key={label.id}
              points={`${anchorX},${label.textY} ${label.side === 'start' ? anchorX + 16 : anchorX - 16},${label.textY} ${label.x},${label.y}`}
              fill="none"
            />
          );
        })}
      </svg>
      {placed.map((label) => (
        <span
          key={label.id}
          className={`structure-label label-${label.side}`}
          style={{top: `${label.textY}px`, [label.side === 'start' ? 'left' : 'right']: `${MARGIN}px`}}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}
