import React, { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import ThoughtLine from './ThoughtLine';

const ALL_ANALYSIS_STEPS = [
  'Allocating secure in-memory volatile buffer & verifying zero retention',
  'Parsing document structure, clauses, and paragraph boundaries',
  'Auditing 7 predatory traps (security deposits, notice waivers, auto-renewals)',
  'Synthesizing 6-domain plain-language legal summary',
  'Cross-referencing and grounding verbatim quotations & citations'
];

export function ThinkingProgressPanel({
  isLoading,
  currentStage = 0,
  filename = 'rental agreement',
  clauseCount = null,
  flagCount = null,
}) {
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStage, setReplayStage] = useState(0);

  // Active working state (either real backend loading or user clicking replay)
  const isWorking = isLoading || isReplaying;

  const handleReplay = (e) => {
    e.stopPropagation();
    if (isWorking) return;
    setIsReplaying(true);
    setReplayStage(0);

    const t1 = setTimeout(() => setReplayStage(1), 600);
    const t2 = setTimeout(() => setReplayStage(2), 1200);
    const t3 = setTimeout(() => setReplayStage(3), 1800);
    const t4 = setTimeout(() => setReplayStage(4), 2400);
    const t5 = setTimeout(() => setIsReplaying(false), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  };

  const activeStage = isReplaying ? replayStage : currentStage;

  const visibleSteps = useMemo(() => {
    if (!isWorking) {
      return ALL_ANALYSIS_STEPS;
    }
    return ALL_ANALYSIS_STEPS.slice(0, Math.min(activeStage + 1, ALL_ANALYSIS_STEPS.length));
  }, [isWorking, activeStage]);

  const headerBadges = !isWorking ? (
    <div className="thinking-meta-badges">
      {clauseCount && (
        <span className="stat-pill">{clauseCount} clauses indexed</span>
      )}
      {flagCount !== null && (
        <span className="stat-pill flag-pill">{flagCount} red flags audited</span>
      )}
      <button
        type="button"
        className="btn-replay-thought"
        onClick={handleReplay}
        title="Replay AI reasoning animation"
        aria-label="Replay thought process"
      >
        <RotateCcw size={12} aria-hidden="true" />
        <span>Replay</span>
      </button>
    </div>
  ) : null;

  return (
    <div className="claude-thinking-container" role="status">
      <ThoughtLine
        working={isWorking}
        steps={visibleSteps}
        label={
          filename
            ? `Auditing ${filename}…`
            : 'Auditing lease agreement…'
        }
        doneLabel="Thought for"
        glyph="sparkle"
        fontSize={15}
        breathPeriod={1.6}
        breathDepth={0.45}
        settleDuration={350}
        settleBlur={2}
        collapsible={true}
        collapseOnSettle={true}
        showTimer={true}
        color="var(--text-primary)"
        glyphColor="#ffffff"
        headerRight={headerBadges}
      />
    </div>
  );
}
