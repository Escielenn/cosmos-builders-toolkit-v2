interface CodexCompletionBarProps {
  percent: number;
}

const CodexCompletionBar = ({ percent }: CodexCompletionBarProps) => {
  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] tracking-wider text-t3/50 uppercase">
          Survey: {percent}%
        </span>
      </div>
      <div className="sf-progress">
        <div
          className="sf-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default CodexCompletionBar;
