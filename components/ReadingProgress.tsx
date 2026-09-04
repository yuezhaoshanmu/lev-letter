type ReadingProgressProps = { progress: number };

export default function ReadingProgress({ progress }: ReadingProgressProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const page = Math.min(99, Math.max(1, Math.floor(safeProgress * 99) + 1));
  return <aside className="reading-progress" aria-label={`第 ${page} 页`}><span>第 {String(page).padStart(2, "0")} 页</span></aside>;
}
