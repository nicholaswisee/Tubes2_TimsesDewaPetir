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
        <main className="page-wrap px-4 pb-8 pt-10 min-h-screen">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl mb-3">
                        DOM Tree Visualizer
                    </h1>
                    <p className="text-[var(--sea-ink-soft)] max-w-2xl mx-auto">
                        Input any URL and enter an optional CSS selector to
                        fetch and visualize its graphical DOM structure. Nodes
                        matching the selector will be highlighted.
                    </p>
                </div>

                <SearchForm onSubmit={handleSearch} isLoading={isLoading} />

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-700 text-sm">
                        <p>
                            <strong>Error Fetching DOM:</strong>
                        </p>
                        <p>{error.message}</p>
                    </div>
                )}

                {result && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                        <div className="lg:col-span-2 bg-white rounded-[1.5rem] overflow-hidden flex flex-col h-[700px] border border-[var(--line)] relative shadow-md">
                            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-white to-transparent pointer-events-none">
                                <h2 className="text-xl font-semibold text-[var(--surface)] drop-shadow-sm">
                                    DOM Tree Topography
                                </h2>
                                <div className="flex gap-4 text-xs font-mono drop-shadow-sm">
                                    <span className="text-[var(--palm)] bg-[var(--sand)] px-2 py-1 rounded border border-[var(--palm)]/30 backdrop-blur-sm">
                                        {result.matches?.length || 0} matches
                                    </span>
                                    <span className="text-[var(--lagoon-deep)] bg-[var(--foam)] px-2 py-1 rounded border border-[var(--lagoon)]/30 backdrop-blur-sm">
                                        {result.visited_count} nodes visited
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-full custom-scrollbar">
                                <DomTreeGraph
                                    tree={result.tree}
                                    matchedNodeIds={matchedNodeIds}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="island-shell rounded-[1.5rem] p-6 border border-[var(--line)]">
                                <h3 className="text-lg font-medium text-[var(--sea-ink)] mb-3">
                                    Analytics
                                </h3>
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="flex justify-between text-[var(--sea-ink-soft)]">
                                        <span>Traversal Time:</span>
                                        <span className="text-[var(--palm)] font-semibold">
                                            {result.duration_ms} ms
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[var(--sea-ink-soft)]">
                                        <span>Max Depth:</span>
                                        <span className="text-[var(--lagoon-deep)] font-semibold">
                                            {result.max_depth}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
