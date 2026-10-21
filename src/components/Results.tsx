import { useState } from "react";
import { Avatar, displayName } from "@/components/Nominee";
import { Empty } from "@/components/ui-kit";
import { tally, type DB, type Election } from "@/lib/store";

function ageFromDateOfBirth(dob?: string) {
  if (!dob) return null;
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime()) || birthDate.getTime() > Date.now()) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) age--;
  return age;
}

export function Results({ d, e }: { d: DB; e: Election }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const positions = tally(d, e);
  const hasCandidates = positions.some(({ rows }) => rows.length > 0);

  return (
    <div className="space-y-5">
      {hasCandidates && (
        <input
          className="field w-full"
          type="search"
          aria-label="Search contestants by name"
          placeholder="Search contestants by name..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      {positions.map(({ position, rows, total }) => {
        const filteredRows = rows.filter(({ c, user }) =>
          `${displayName(c, user)} ${user?.name ?? ""}`.toLocaleLowerCase().includes(search),
        );

        return (
          <section key={position.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{position.title}</h3>
              <span className="text-[12px] text-muted-foreground">{total.toLocaleString()} votes</span>
            </div>
            {rows.length === 0 ? (
              <Empty>No approved candidates.</Empty>
            ) : filteredRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
                No contestants match your search.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRows.map(({ c, user, count }) => {
                  const age = ageFromDateOfBirth(c.profile?.dob);
                  return (
                    <article key={c.id} className="flex flex-col rounded-xl border border-border bg-card p-3">
                      <div className="mb-3 flex justify-center">
                        <Avatar c={c} u={user} size={124} />
                      </div>
                      <h4 className="text-base font-semibold">{displayName(c, user)}</h4>
                      {c.profile?.location && (
                        <p className="mt-1 text-[12px] text-muted-foreground">State: {c.profile.location}</p>
                      )}
                      {age !== null && (
                        <p className="mt-1 text-[12px] text-muted-foreground">Age: {age}</p>
                      )}
                      <p className="mt-2 text-[12px] font-semibold text-brand">
                        Votes: {count.toLocaleString()}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
