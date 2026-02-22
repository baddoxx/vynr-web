import type { WineData } from "@/lib/posts";

function renderStars(rating: number): string {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? "\u2605" : "\u2606")).join("");
}

interface TasteBarProps {
  label: string;
  left: string;
  right: string;
  value: number;
}

function TasteBar({ label, left, right, value }: TasteBarProps) {
  const percentage = ((value + 1) / 2) * 100;
  const displayLabel = value < 0 ? left : value > 0 ? right : "";

  return (
    <div className="wine-taste-row">
      <span className="wine-taste-dim">{label}</span>
      <div className="wine-taste-track">
        <div className="wine-taste-center" />
        <div className="wine-taste-thumb" style={{ left: `${percentage}%` }} />
      </div>
      <span className="wine-taste-endpoint">{displayLabel}</span>
    </div>
  );
}

export default function WineCard({ wine }: { wine: WineData }) {
  const nameParts: string[] = [];
  if (wine.producer) nameParts.push(wine.producer);
  nameParts.push(wine.wine);
  if (wine.vintage) nameParts.push(wine.vintage);

  const taste = wine.taste;

  return (
    <div className="wine-card">
      <div className="wine-card-name">{nameParts.join(" \u00B7 ")}</div>
      {wine.rating != null && wine.rating >= 1 && wine.rating <= 5 && (
        <div className="wine-card-rating">{renderStars(wine.rating)}</div>
      )}
      {wine.notes && <div className="wine-card-notes">{wine.notes}</div>}
      {taste && (
        <div className="wine-card-taste">
          <div className="wine-card-taste-label">SENSORY IMPRESSIONS</div>
          {taste.brightness != null && (
            <TasteBar label="Brightness" left="Dull" right="Bright" value={taste.brightness} />
          )}
          {taste.aroma != null && (
            <TasteBar label="Aroma" left="Savory" right="Fruity" value={taste.aroma} />
          )}
          {taste.structure != null && (
            <TasteBar label="Structure" left="Taut" right="Round" value={taste.structure} />
          )}
          {taste.grip != null && (
            <TasteBar label="Grip" left="Soft" right="Firm" value={taste.grip} />
          )}
          {taste.finish != null && (
            <TasteBar label="Finish" left="Short" right="Long" value={taste.finish} />
          )}
        </div>
      )}
    </div>
  );
}
