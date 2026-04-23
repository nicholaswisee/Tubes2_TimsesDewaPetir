import { useState } from "react";
import type { SearchRequest } from "../api/types";

interface SearchFormProps {
    onSubmit: (request: SearchRequest) => void;
    isLoading: boolean;
}

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [url, setUrl] = useState("");
    const [selector, setSelector] = useState("");
    const [limit, setLimit] = useState<number>(0);
    const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
    const [parallel, setParallel] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        onSubmit({ url, selector, algorithm, limit, parallel });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="url"
                    className="text-sm font-medium text-[var(--sea-ink-soft)] w-max"
                >
                    Website URL
                </label>
                <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="selector"
                    className="text-sm font-medium text-[var(--sea-ink-soft)] w-max"
                >
                    CSS Selector (Optional)
                </label>
                <input
                    id="selector"
                    type="text"
                    value={selector}
                    onChange={(e) => setSelector(e.target.value)}
                    placeholder="e.g. div.container"
                    className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="limit"
                    className="text-sm font-medium text-[var(--sea-ink-soft)] w-max"
                >
                    Top N Matches (0 = All)
                </label>
                <input
                    id="limit"
                    type="number"
                    min="0"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                />
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
                <span className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                    Algorithm
                </span>
                <div className="flex gap-4 items-center mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="algorithm"
                            value="bfs"
                            checked={algorithm === "bfs"}
                            onChange={() => setAlgorithm("bfs")}
                            className="text-[rgba(79,184,178,1)] focus:ring-[rgba(79,184,178,0.2)]"
                        />
                        <span className="text-sm text-[var(--sea-ink)]">
                            BFS
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="algorithm"
                            value="dfs"
                            checked={algorithm === "dfs"}
                            onChange={() => setAlgorithm("dfs")}
                            className="text-[rgba(79,184,178,1)] focus:ring-[rgba(79,184,178,0.2)]"
                        />
                        <span className="text-sm text-[var(--sea-ink)]">
                            DFS
                        </span>
                    </label>
                </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none px-1">
                <div
                    onClick={() => setParallel((p) => !p)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        parallel ? "bg-[var(--lagoon)]" : "bg-[var(--line)]"
                    }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                            parallel ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--sea-ink)] leading-tight">Multithreading</p>
                    <p className="text-[11px] text-[var(--sea-ink-soft)] leading-tight">
                        {algorithm === "bfs" ? "Level-parallel BFS" : "Subtree-parallel DFS"}
                    </p>
                </div>
            </label>

            <button
                type="submit"
                disabled={isLoading || !url}
                className="mt-2 w-full rounded-xl bg-[var(--lagoon-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Analyzing..." : "Fetch DOM Tree"}
            </button>
        </form>
    );
}
