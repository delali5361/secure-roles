import { Bar, Card } from "@/components/ui-kit";
import { tally, type DB, type Election } from "@/lib/store";

export function Results({ d, e }: { d: DB; e: Election }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tally(d, e).map(({ position, rows, total }) => (
        <Card key={position.id}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{position.title}</h3>
            <span className="text-[12px] text-muted-foreground">{total} votes</span>
          </div>
          <div className="space-y-4">
            {rows.length === 0 && <p className="text-[13px] text-muted-foreground">No approved candidates.</p>}
            {rows.map((r, i) => {
              const pct = total ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={r.c.id}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className={i === 0 && r.count > 0 ? "font-semibold text-mint" : ""}>{r.user?.name ?? "Unknown"}{i === 0 && r.count > 0 ? " · leading" : ""}</span>
                    <span className="text-muted-foreground">{r.count} · {pct}%</span>
                  </div>
                  <Bar pct={pct} tone={i === 0 ? "mint" : "brand"} />
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
