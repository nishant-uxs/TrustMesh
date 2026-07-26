"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "@/lib/format";

export function SearchFilters({
  placeholder = "Search…",
  filters,
  onSearch,
  onFilter,
}: {
  placeholder?: string;
  filters: { label: string; value: string }[];
  onSearch: (q: string) => void;
  onFilter: (value: string) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(filters[0]?.value ?? "all");
  const chips = useMemo(() => filters, [filters]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-deep/15 bg-white pl-9 pr-3 text-sm outline-none ring-sea/40 focus:ring-2"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setActive(f.value);
              onFilter(f.value);
            }}
            className={clsx(
              "rounded-xl px-3 py-2 text-xs font-medium transition",
              active === f.value
                ? "bg-deep text-white"
                : "bg-deep/5 text-deep/70 hover:bg-deep/10 hover:text-deep",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-xl border border-deep/15 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-slate">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="rounded-xl border border-deep/15 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
