export default function ProgressBar({ percent, thin = false }: { percent: number; thin?: boolean }) {
  return (
    <div className={`progress-track${thin ? ' thin' : ''}`}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
