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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        onSubmit({ url, selector, algorithm, limit });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full"
        >
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
                    className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
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
                    className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
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
                    onChange={(e) =>
                        setLimit(parseInt(e.target.value) || 0)
                    }
                    className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
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
