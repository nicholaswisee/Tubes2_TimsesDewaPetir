import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { DomTreeGraph } from "../components/DomTreeGraph";
import { searchDOM } from "../api/client";
import type { SearchResponse, SearchRequest } from "../api/types";

export const Route = createFileRoute("/")({ component: App });

function App() {
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleSearch = async (request: SearchRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await searchDOM(request);
            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error("Unknown error occurred"),
            );
        } finally {
            setIsLoading(false);
        }
    };

    const matchedNodeIds = new Set(result?.matches?.map((m) => m.id) || []);

    return (
        <main className="h-screen w-full flex overflow-hidden">
            {/* Side Panel */}
            <aside className="w-80 sm:w-[22rem] flex-shrink-0 flex flex-col p-6 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface-strong)] z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] hidden sm:flex">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] mb-1">
                        DOM Vector
                    </h1>
                    <p className="text-[13px] text-[var(--sea-ink-soft)] leading-snug">
                        Input a URL and an optional CSS selector to fetch and
                        visualize its graphical structure.
                    </p>
                </div>

                <div className="mb-6 border-b border-[var(--line)] pb-6">
                    <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-700 text-sm">
                        <p>
                            <strong>Error:</strong>
                        </p>
                        <p>{error.message}</p>
                    </div>
                )}

                {result && (
                    <div className="island-shell rounded-[1rem] p-5 border border-[var(--line)] mt-auto mt-2">
                        <h3 className="text-md font-medium text-[var(--sea-ink)] mb-3 border-b border-[var(--line)] pb-2">
                            Analytics
                        </h3>
                        <div className="space-y-3 font-mono text-sm mt-3">
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Matches:</span>
                                <span className="text-[var(--palm)] font-semibold bg-[var(--sand)] px-2 py-0.5 rounded shadow-sm">
                                    {result.matches?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Visited:</span>
                                <span className="text-[var(--lagoon-deep)] font-semibold bg-[var(--foam)] border border-[var(--lagoon)]/20 px-2 py-0.5 rounded shadow-sm">
                                    {result.visited_count}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Time:</span>
                                <span className="text-[var(--sea-ink)] font-semibold">
                                    {result.duration_ms} ms
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Max Depth:</span>
                                <span className="text-[var(--palm)] font-semibold">
                                    {result.max_depth}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            <div className="sm:hidden w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white">
                <p className="text-xl font-bold text-[var(--sea-ink)]">
                    Desktop Recommended
                </p>
                <p className="text-sm text-[var(--sea-ink-soft)] mt-2">
                    The DOM Tree visualizer canvas requires a wider screen.
                </p>
            </div>

            <section className="hidden sm:flex flex-1 relative bg-white flex-col">
                {result ? (
                    <>
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 pointer-events-none">
                            <h2 className="text-[15px] font-semibold text-[var(--surface)] drop-shadow-sm ml-2 mt-2 bg-white/70 px-3 py-1 rounded-full backdrop-blur-md border border-[var(--surface)] shadow-sm">
                                DOM Tree Topography
                            </h2>
                        </div>
                        <div className="flex-1 w-full h-full custom-scrollbar">
                            <DomTreeGraph
                                tree={result.tree}
                                matchedNodeIds={matchedNodeIds}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-[var(--sand)]/10">
                        <div className="w-16 h-16 rounded-full bg-[var(--lagoon)]/10 ring-[var(--lagoon)]/20 ring-[4px] flex items-center justify-center mb-5">
                            <svg
                                className="w-8 h-8 text-[var(--lagoon-deep)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                ></path>
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-[var(--surface)]">
                            Awaiting Target
                        </p>
                        <p className="text-[var(--surface)] mt-2 text-sm max-w-sm text-center">
                            Configure search parameters in the side panel to
                            begin tracing an HTML structure.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
