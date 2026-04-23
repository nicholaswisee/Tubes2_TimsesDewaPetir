import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SearchForm } from "../components/SearchForm";
import { DomTreeGraph } from "../components/DomTreeGraph";
import { searchDOM } from "../api/client";
import type { SearchResponse, SearchRequest } from "../api/types";

export const Route = createFileRoute("/")({ component: App });

function App() {
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Animation States
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(400); // ms per frame

    const handleSearch = async (request: SearchRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await searchDOM(request);
            setResult(data);
            setCurrentFrame(0);
            if (data.animation_frames && data.animation_frames.length > 0) {
                setIsPlaying(true);
            }
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

    // Animation Loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && result?.animation_frames) {
            if (currentFrame >= result.animation_frames.length - 1) {
                setIsPlaying(false);
            } else {
                interval = setInterval(() => {
                    setCurrentFrame((prev) => {
                        if (prev >= result!.animation_frames.length - 1) {
                            setIsPlaying(false);
                            return prev;
                        }
                        return prev + 1;
                    });
                }, speed);
            }
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentFrame, result, speed]);

    let activeNodeId: number | undefined = undefined;
    let trackingIds = new Set<number>();
    let matchedNodeIds = new Set<number>();

    if (result && result.animation_frames && result.animation_frames.length > 0) {
        const frame = result.animation_frames[currentFrame] || result.animation_frames[result.animation_frames.length - 1];
        activeNodeId = frame.active_id;
        matchedNodeIds = new Set(frame.matched_ids || []);
        trackingIds = new Set([...(frame.queue_ids || []), ...(frame.stack_ids || [])]);
    } else if (result) {
        // Fallback for immediate render logic
        matchedNodeIds = new Set(result.matches?.map((m) => m.id) || []);
    }

    return (
        <main className="h-screen w-full flex overflow-hidden">
            {/* Side Panel */}
            <aside className="w-80 sm:w-[22rem] flex-shrink-0 flex flex-col p-6 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface-strong)] z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] hidden sm:flex">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] mb-1">
                        DOM Vector
                    </h1>
                    <p className="text-[13px] text-[var(--sea-ink-soft)] leading-snug">
                        Input a URL and an optional CSS selector to fetch and visualize its graphical structure.
                    </p>
                </div>

                <div className="mb-6 border-b border-[var(--line)] pb-6">
                    <SearchForm 
                        onSubmit={handleSearch} 
                        isLoading={isLoading} 
                    />
                </div>

                {/* Animation Controller */}
                {result?.animation_frames && (
                    <div className="mb-6 border-b border-[var(--line)] pb-6 relative">
                         {/* Glowing pulse if playing */}
                         {isPlaying && <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse uppercase" />}
                         <h3 className="text-[14px] font-semibold text-[var(--sea-ink)] mb-3">Playback Control</h3>
                         <div className="flex gap-2 mb-4">
                             <button 
                                 onClick={() => setIsPlaying(!isPlaying)}
                                 className="flex-1 bg-[var(--lagoon)] text-white text-sm font-semibold py-1.5 rounded-[0.7rem] hover:bg-[var(--lagoon-deep)] transition transform active:scale-95 shadow-sm"
                             >
                                 {isPlaying ? "Pause" : "Play Process"}
                             </button>
                             <button 
                                 onClick={() => { setCurrentFrame(0); setIsPlaying(true); }}
                                 className="px-4 bg-white border border-[var(--line)] text-[var(--sea-ink)] text-sm font-semibold py-1.5 rounded-[0.7rem] hover:bg-[#f1f5f9] transition transform active:scale-95 shadow-sm"
                             >
                                 Restart
                             </button>
                         </div>
                         <div className="flex items-center gap-3">
                             <span className="text-[11px] font-mono text-[var(--sea-ink-soft)] w-7">{currentFrame}</span>
                             <input 
                                 type="range" 
                                 min="0" 
                                 max={result.animation_frames.length - 1} 
                                 value={currentFrame}
                                 onChange={(e) => {
                                     setCurrentFrame(parseInt(e.target.value));
                                     setIsPlaying(false);
                                 }}
                                 className="flex-1 accent-[var(--lagoon-deep)] h-2 cursor-pointer"
                             />
                             <span className="text-[11px] font-mono text-[var(--sea-ink-soft)] w-7 text-right">{result.animation_frames.length - 1}</span>
                         </div>
                         <div className="flex justify-between items-center mt-3 px-1">
                              <span className="text-[12px] font-semibold text-[var(--sea-ink-soft)]">Delay</span>
                              <select 
                                 className="text-xs border border-[var(--line)] rounded-md font-semibold px-2 py-1 bg-white text-[var(--sea-ink)] outline-none focus:ring-1 focus:ring-[var(--lagoon)]"
                                 value={speed} 
                                 onChange={(e) => setSpeed(Number(e.target.value))}
                              >
                                  <option value={1000}>1s (Slow)</option>
                                  <option value={400}>400ms</option>
                                  <option value={100}>100ms (Fast)</option>
                                  <option value={20}>Hyper</option>
                              </select>
                         </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-700 text-sm">
                        <p><strong>Error:</strong></p>
                        <p>{error.message}</p>
                    </div>
                )}

                {result && (
                    <div className="island-shell rounded-[1rem] p-5 border border-[var(--line)] mt-auto mt-2 relative z-10 bg-[var(--surface-strong)]">
                        <h3 className="text-md font-medium text-[var(--sea-ink)] mb-3 border-b border-[var(--line)] pb-2 flex justify-between">
                            <span>Analytics</span>
                            {/* Simple visual sync that shows analytics incrementing along with the frame */}
                            {isPlaying && <span className="text-[10px] uppercase tracking-wide text-orange-500 pt-1">Crunching...</span>}
                        </h3>
                        <div className="space-y-3 font-mono text-sm mt-3">
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Matches Found:</span>
                                <span className="text-[var(--palm)] font-semibold bg-[var(--sand)] px-2 py-0.5 rounded shadow-sm">
                                   {matchedNodeIds.size} / {result.matches?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Nodes Traversed:</span>
                                <span className="text-[var(--lagoon-deep)] font-semibold bg-[var(--foam)] border border-[var(--lagoon)]/20 px-2 py-0.5 rounded shadow-sm">
                                    {Math.min(currentFrame + 1, result.visited_count)} / {result.visited_count}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Time Took:</span>
                                <span className="text-[var(--sea-ink)] font-semibold">{result.duration_ms} ms</span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Max Depth:</span>
                                <span className="text-[var(--palm)] font-semibold">{result.max_depth}</span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Layout Fallback */}
            <div className="sm:hidden w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white">
                <p className="text-xl font-bold text-[var(--sea-ink)]">Desktop Recommended</p>
                <p className="text-sm text-[var(--sea-ink-soft)] mt-2">The DOM Tree visualizer canvas requires a wider screen.</p>
            </div>

            {/* Main Canvas Area */}
            <section className="hidden sm:flex flex-1 relative bg-white flex-col">
                {result ? (
                    <>
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 pointer-events-none">
                            <h2 className="text-[15px] font-semibold text-[var(--sea-ink)] drop-shadow-sm ml-2 mt-2 bg-white/70 px-4 py-1.5 rounded-full backdrop-blur-md border border-[var(--line)] shadow-sm">DOM Tree Topography</h2>
                        </div>
                        <div className="flex-1 w-full h-full custom-scrollbar">
                            <DomTreeGraph 
                                tree={result.tree} 
                                matchedNodeIds={matchedNodeIds} 
                                activeNodeId={activeNodeId}
                                trackingIds={trackingIds}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-[var(--sand)]/10">
                        <div className="w-16 h-16 rounded-full bg-[var(--lagoon)]/10 ring-[var(--lagoon)]/20 ring-[4px] flex items-center justify-center mb-5">
                            <svg className="w-8 h-8 text-[var(--lagoon-deep)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-[var(--sea-ink)]">Awaiting Target</p>
                        <p className="text-[var(--sea-ink-soft)] mt-2 text-sm max-w-sm text-center">Configure search parameters in the side panel to begin tracing an HTML structure.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
