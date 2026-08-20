"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import {
  addFeedbackNote,
  loadFeedbackNotes,
  summarizeFeedback,
  type FeedbackNote,
} from "@/lib/feedback";
import { timeAgo } from "@/lib/format";

const emptyForm = {
  testerLabel: "",
  rating: 4,
  liked: "",
  confusing: "",
  improve: "",
  request: "",
  comments: "",
};

export default function FeedbackPage() {
  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setNotes(loadFeedbackNotes());
  }, []);

  const summary = useMemo(() => summarizeFeedback(notes), [notes]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.liked.trim() && !form.confusing.trim() && !form.comments.trim()) {
      toast.error("Add at least one note (liked, confusing, or comments).");
      return;
    }
    const note = addFeedbackNote(form);
    setNotes(loadFeedbackNotes());
    setForm(emptyForm);
    toast.success(`Saved locally as ${note.testerLabel}`);
  }

  return (
    <div>
      <TopBar
        title="Feedback"
        subtitle="Local demo-tester notes for this browser. Not remote users, not fabricated cloud traffic."
      />

      <section className="mb-8 tm-surface rounded-2xl p-6" data-testid="feedback-owner-summary">
        <h2 className="font-display text-2xl text-deep">Owner summary</h2>
        <p className="mt-1 text-sm text-slate">
          Stored in this browser only (`tm-feedback-notes`). Demo testers from a Testnet walkthrough.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-foam/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate">Notes</p>
            <p className="mt-2 font-display text-3xl text-deep">{summary.count}</p>
          </div>
          <div className="rounded-xl bg-foam/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate">Avg rating</p>
            <p className="mt-2 font-display text-3xl text-deep">
              {summary.count === 0 ? "—" : summary.averageRating.toFixed(1)}
            </p>
          </div>
        </div>
        {notes.length > 0 && (
          <ul className="mt-6 space-y-3">
            {notes
              .slice()
              .reverse()
              .map((n) => (
                <li key={n.id} className="rounded-xl border border-deep/10 bg-white/70 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-deep">
                      {n.testerLabel} · {n.rating}/5
                    </p>
                    <p className="text-xs text-slate">{timeAgo(Math.floor(n.at / 1000))}</p>
                  </div>
                  {n.confusing && <p className="mt-2 text-deep">Confusing: {n.confusing}</p>}
                  {n.improve && <p className="mt-1 text-slate">Improve: {n.improve}</p>}
                  {n.comments && <p className="mt-1 text-slate">{n.comments}</p>}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="tm-surface max-w-2xl rounded-2xl p-6">
        <h2 className="font-display text-2xl text-deep">Submit a note</h2>
        <p className="mt-1 text-sm text-slate">
          Short product notes from people who actually clicked around this Testnet build.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="text-slate">Tester label</span>
            <input
              className="rounded-xl border border-deep/15 bg-white px-3 py-2 text-deep"
              value={form.testerLabel}
              onChange={(e) => setForm((f) => ({ ...f, testerLabel: e.target.value }))}
              placeholder="tester-03"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate">Rating (1–5)</span>
            <select
              className="rounded-xl border border-deep/15 bg-white px-3 py-2 text-deep"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ["liked", "What worked"],
              ["confusing", "What was confusing"],
              ["improve", "What to improve"],
              ["request", "Feature request"],
              ["comments", "Other comments"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="grid gap-1 text-sm">
              <span className="text-slate">{label}</span>
              <textarea
                className="min-h-20 rounded-xl border border-deep/15 bg-white px-3 py-2 text-deep"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <Button type="submit">Save locally</Button>
        </form>
      </section>
    </div>
  );
}
