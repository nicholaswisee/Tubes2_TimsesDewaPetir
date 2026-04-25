import { useState } from "react";
import type { SearchRequest } from "../api/types";

interface SearchFormProps {
    onSubmit: (request: SearchRequest) => void;
    isLoading: boolean;
}

type InputMode = "url" | "html";

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [mode, setMode] = useState<InputMode>("url");
    const [url, setUrl] = useState("");
    const [rawHtml, setRawHtml] = useState("");
    const [selector, setSelector] = useState("");
    const [limit, setLimit] = useState<number>(0);
    const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
    const [parallel, setParallel] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "url" && !url) return;
        if (mode === "html" && !rawHtml.trim()) return;

        onSubmit({
            url: mode === "url" ? url : "",
            html: mode === "html" ? rawHtml : "",
            selector,
            algorithm,
            limit,
            parallel,
        });
    };

    const inputClass =
        "rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">

            {/* Mode toggle: URL vs Raw HTML */}
            <div className="flex rounded-xl overflow-hidden border border-[var(--line)] text-[13px] font-semibold">
                <button
                    type="button"
                    onClick={() => setMode("url")}
                    className={`flex-1 py-2 transition ${
                        mode === "url"
                            ? "bg-[var(--lagoon)] text-white"
                            : "bg-white text-[var(--sea-ink-soft)] hover:bg-[var(--foam)]"
                    }`}
                >
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode("html")}
                    className={`flex-1 py-2 transition ${
                        mode === "html"
                            ? "bg-[var(--lagoon)] text-white"
                            : "bg-white text-[var(--sea-ink-soft)] hover:bg-[var(--foam)]"
                    }`}
                >
                    Raw HTML
                </button>
            </div>

            {mode === "url" ? (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="url" className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                        Website URL
                    </label>
                    <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                        className={inputClass}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="rawHtml" className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                        Raw HTML
                    </label>
                    <textarea
                        id="rawHtml"
                        value={rawHtml}
                        onChange={(e) => setRawHtml(e.target.value)}
                        placeholder="<html><body>...</body></html>"
                        required
                        rows={7}
                        className={`${inputClass} resize-y font-mono text-[11px] leading-relaxed`}
                    />
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="selector" className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                    CSS Selector (Optional)
                </label>
                <input
                    id="selector"
                    type="text"
                    value={selector}
                    onChange={(e) => setSelector(e.target.value)}
                    placeholder="e.g. div.container"
                    className={inputClass}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="limit" className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                    Top N Matches (0 = All)
                </label>
                <input
                    id="limit"
                    type="number"
                    min="0"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                    className={inputClass}
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
                        <span className="text-sm text-[var(--sea-ink)]">BFS</span>
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
                        <span className="text-sm text-[var(--sea-ink)]">DFS</span>
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
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-[var(--lagoon-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Analyzing..." : "Fetch DOM Tree"}
            </button>
        </form>
    );
}
