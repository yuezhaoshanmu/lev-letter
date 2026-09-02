import Butterfly from "./Butterfly";

type ReadingProgressProps = { progress: number };

export default function ReadingProgress({ progress }: ReadingProgressProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return (
    <aside className="reading-progress" aria-label="阅读进度" style={{ ["--progress" as string]: safeProgress }}>
      <div className="progress-track"><div className="progress-fill" style={{ height: `${safeProgress * 100}%`, width: `${safeProgress * 100}%` }} /></div>
      <Butterfly variant="moon" className="progress-butterfly" />
      <span className="progress-end" aria-hidden="true" />
    </aside>
  );
}
