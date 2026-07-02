export default function CardItem({ card }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-slate-100">
      <div className="font-medium">{card.title}</div>
    </div>
  );
}
