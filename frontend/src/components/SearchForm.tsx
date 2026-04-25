import { useState } from "react";
import type { SearchRequest } from "../api/types";

interface SearchFormProps {
    onSubmit: (request: SearchRequest) => void;
    isLoading: boolean;
}

type InputMode = "url" | "html";

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
    const [inputMode, setInputMode] = useState<InputMode>("url");
    const [url, setUrl] = useState("");
    const [rawHtml, setRawHtml] = useState("");
    const [htmlError, setHtmlError] = useState<string | null>(null);
    const [selector, setSelector] = useState("");
    const [limit, setLimit] = useState<number>(0);
    const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
    const [parallel, setParallel] = useState<boolean>(false);

    const validateHtml = (html: string): boolean => {
        const trimmed = html.trim();
        if (!trimmed) {
            setHtmlError("HTML tidak boleh kosong.");
            return false;
        }
        if (!/^<[a-zA-Z!]/.test(trimmed)) {
            setHtmlError("Input bukan HTML valid. Harus diawali tag seperti <html> atau <!DOCTYPE html>.");
            return false;
        }
        if (!/<\/[a-zA-Z]|<[a-zA-Z][^>]*\/>/.test(trimmed)) {
            setHtmlError("HTML terlihat malformed — tidak ada closing tag.");
            return false;
        }
        setHtmlError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMode === "url") {
            if (!url) return;
            onSubmit({ url, selector, algorithm, limit, parallel });
        } else {
            if (!validateHtml(rawHtml)) return;
            onSubmit({ url: "", html: rawHtml, selector, algorithm, limit, parallel });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">

            {/* Toggle URL / Raw HTML */}
            <div className="flex rounded-xl overflow-hidden border border-[var(--line)] bg-[rgba(23,58,64,0.05)] p-1 gap-1">
                <button
                    type="button"
                    onClick={() => { setInputMode("url"); setHtmlError(null); }}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition ${
                        inputMode === "url"
                            ? "bg-white text-[var(--sea-ink)] shadow-sm border border-[var(--line)]"
                            : "text-[var(--sea-ink-soft)]"
                    }`}
                >
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setInputMode("html")}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition ${
                        inputMode === "html"
                            ? "bg-white text-[var(--sea-ink)] shadow-sm border border-[var(--line)]"
                            : "text-[var(--sea-ink-soft)]"
                    }`}
                >
                    Raw HTML
                </button>
            </div>

            {/* URL Input */}
            {inputMode === "url" && (
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
                        className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                    />
                </div>
            )}

            {/* Raw HTML Input */}
            {inputMode === "html" && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="rawHtml" className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">
                        Raw HTML
                    </label>
                    <textarea
                        id="rawHtml"
                        value={rawHtml}
                        onChange={(e) => { setRawHtml(e.target.value); if (htmlError) setHtmlError(null); }}
                        onBlur={() => rawHtml && validateHtml(rawHtml)}
                        placeholder={"<html>\n  <body>\n    <p>Hello</p>\n  </body>\n</html>"}
                        rows={7}
                        spellCheck={false}
                        className={`rounded-xl border bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] px-4 py-2.5 outline-none font-mono text-[12px] resize-y transition ${
                            htmlError
                                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
                        }`}
                    />
                    {htmlError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[12px] text-red-700 leading-snug">{htmlError}</p>
                        </div>
                    )}
                </div>
            )}

            {/* CSS Selector */}
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
                    className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                />
            </div>

            {/* Limit */}
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
                    className="rounded-xl border border-[var(--line)] bg-[rgba(23,58,64,0.07)] text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 px-4 py-2.5 outline-none transition focus:border-[rgba(79,184,178,0.6)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)] focus:bg-white/70"
                />
            </div>

            {/* Algorithm */}
            <div className="flex flex-col gap-1.5 mb-2">
                <span className="text-sm font-medium text-[var(--sea-ink-soft)] w-max">Algorithm</span>
                <div className="flex gap-4 items-center mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="algorithm" value="bfs" checked={algorithm === "bfs"}
                            onChange={() => setAlgorithm("bfs")}
                            className="text-[rgba(79,184,178,1)] focus:ring-[rgba(79,184,178,0.2)]" />
                        <span className="text-sm text-[var(--sea-ink)]">BFS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="algorithm" value="dfs" checked={algorithm === "dfs"}
                            onChange={() => setAlgorithm("dfs")}
                            className="text-[rgba(79,184,178,1)] focus:ring-[rgba(79,184,178,0.2)]" />
                        <span className="text-sm text-[var(--sea-ink)]">DFS</span>
                    </label>
                </div>
            </div>

            {/* Multithreading toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none px-1">
                <div
                    onClick={() => setParallel((p) => !p)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        parallel ? "bg-[var(--lagoon)]" : "bg-[var(--line)]"
                    }`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        parallel ? "translate-x-4" : "translate-x-0"
                    }`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--sea-ink)] leading-tight">Multithreading</p>
                    <p className="text-[11px] text-[var(--sea-ink-soft)] leading-tight">
                        {algorithm === "bfs" ? "Level-parallel BFS" : "Subtree-parallel DFS"}
                    </p>
                </div>
            </label>

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-[var(--lagoon-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Analyzing..." : inputMode === "url" ? "Fetch DOM Tree" : "Parse HTML"}
            </button>
        </form>
    );
}