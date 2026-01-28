interface GenderRatioProps {
  male: number;
  female: number;
  total: number;
}

export function GenderRatio({ male, female, total }: GenderRatioProps) {
  if (total === 0) return null;

  const malePercent = Math.round((male / total) * 100);
  const femalePercent = Math.round((female / total) * 100);
  const otherPercent = 100 - malePercent - femalePercent;

  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {femalePercent > 0 && (
          <div
            className="bg-pink-500 transition-all"
            style={{ width: `${femalePercent}%` }}
          />
        )}
        {malePercent > 0 && (
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${malePercent}%` }}
          />
        )}
        {otherPercent > 0 && (
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${otherPercent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{femalePercent}% mujeres</span>
        <span>{malePercent}% hombres</span>
      </div>
    </div>
  );
}
