import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SearchForm } from "../components/SearchForm";
import { DomTreeGraph } from "../components/DomTreeGraph";
import { searchDOM, downloadLatestLog } from "../api/client";
import type { SearchResponse, SearchRequest } from "../api/types";

export const Route = createFileRoute("/")({ component: App });

function App() {
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Animation States
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(400);

    // Ref for auto-scrolling traversal log to active step
    const activeLogRowRef = useRef<HTMLDivElement>(null);

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
        } catch (err: any) {
            const raw =
                err?.response?.data?.error ||
                err?.message ||
                "Unknown error occurred";

            const friendly =
                raw.includes("no such host") || raw.includes("dial tcp")
                    ? "URL tidak dapat dijangkau. Pastikan URL benar dan dapat diakses."
                    : raw.includes("timeout")
                    ? "Koneksi timeout. Coba lagi atau gunakan URL lain."
                    : raw.includes("certificate")
                    ? "URL memiliki masalah SSL/HTTPS."
                    : raw;

            setError(new Error(friendly));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadLatestLog();
        } catch {
            // silently fail — backend may not have a log yet
        } finally {
            setIsDownloading(false);
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

    // Auto-scroll traversal log to the active row
    useEffect(() => {
        if (activeLogRowRef.current) {
            activeLogRowRef.current.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [currentFrame]);

    let activeNodeId: number | undefined = undefined;
    let trackingIds = new Set<number>();
    let matchedNodeIds = new Set<number>();

    if (result && result.animation_frames && result.animation_frames.length > 0) {
        const frame =
            result.animation_frames[currentFrame] ||
            result.animation_frames[result.animation_frames.length - 1];
        activeNodeId = frame.active_id;
        matchedNodeIds = new Set(frame.matched_ids || []);
        trackingIds = new Set([
            ...(frame.queue_ids || []),
            ...(frame.stack_ids || []),
        ]);
    } else if (result) {
        matchedNodeIds = new Set(result.matches?.map((m) => m.id) || []);
    }

    const displayFrame = result?.animation_frames?.length
        ? currentFrame
        : result?.traversal_log
          ? result.traversal_log.length - 1
          : 0;

    return (
        <main className="h-screen w-full flex overflow-hidden">
            {/* ── Left Sidebar: form + animation control ── */}
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

                {/* Animation Controller */}
                {result?.animation_frames && (
                    <div className="mb-6 border-b border-[var(--line)] pb-6 relative">
                        {isPlaying && (
                            <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        )}
                        <h3 className="text-[14px] font-semibold text-[var(--sea-ink)] mb-3">
                            Playback Control
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="flex-1 bg-[var(--lagoon)] text-white text-sm font-semibold py-1.5 rounded-[0.7rem] hover:bg-[var(--lagoon-deep)] transition transform active:scale-95 shadow-sm"
                            >
                                {isPlaying ? "Pause" : "Play Process"}
                            </button>
                            <button
                                onClick={() => {
                                    setCurrentFrame(0);
                                    setIsPlaying(true);
                                }}
                                className="px-4 bg-white border border-[var(--line)] text-[var(--sea-ink)] text-sm font-semibold py-1.5 rounded-[0.7rem] hover:bg-[#f1f5f9] transition transform active:scale-95 shadow-sm"
                            >
                                Restart
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono text-[var(--sea-ink-soft)] w-7">
                                {currentFrame}
                            </span>
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
                            <span className="text-[11px] font-mono text-[var(--sea-ink-soft)] w-7 text-right">
                                {result.animation_frames.length - 1}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-3 px-1">
                            <span className="text-[12px] font-semibold text-[var(--sea-ink-soft)]">
                                Delay
                            </span>
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
                        <p>
                            <strong>Error:</strong>
                        </p>
                        <p>{error.message}</p>
                    </div>
                )}
            </aside>

            {/* Mobile fallback */}
            <div className="sm:hidden w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white">
                <p className="text-xl font-bold text-[var(--sea-ink)]">
                    Desktop Recommended
                </p>
                <p className="text-sm text-[var(--sea-ink-soft)] mt-2">
                    The DOM Tree visualizer canvas requires a wider screen.
                </p>
            </div>

            {/* ── Main Canvas: DOM tree ── */}
            <section className="hidden sm:flex flex-1 relative bg-white flex-col min-w-0">
                {result ? (
                    <>
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 pointer-events-none">
                            <h2 className="text-[15px] font-semibold text-[var(--sea-ink)] drop-shadow-sm ml-2 mt-2 bg-white/70 px-4 py-1.5 rounded-full backdrop-blur-md border border-[var(--line)] shadow-sm">
                                DOM Tree Topography
                            </h2>
                        </div>
                        <div className="flex-1 w-full h-full custom-scrollbar">
                            <DomTreeGraph
                                log={result.traversal_log}
                                currentFrame={displayFrame}
                                matchedNodeIds={matchedNodeIds}
                                activeNodeId={activeNodeId}
                                trackingIds={trackingIds}
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
                                />
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-[var(--sea-ink)]">
                            Awaiting Target
                        </p>
                        <p className="text-[var(--sea-ink-soft)] mt-2 text-sm max-w-sm text-center">
                            Configure search parameters in the side panel to begin
                            tracing an HTML structure.
                        </p>
                    </div>
                )}
            </section>

            {/* ── Right Panel: Analytics + Traversal Log ── */}
            {result && (
                <aside className="w-[19rem] flex-shrink-0 hidden sm:flex flex-col border-l border-[var(--line)] bg-[var(--surface-strong)] shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.12)] overflow-hidden">

                    {/* Analytics */}
                    <div className="px-5 pt-5 pb-4 border-b border-[var(--line)] flex-shrink-0">
                        <h3 className="text-[13px] font-semibold text-[var(--sea-ink)] mb-3 flex justify-between items-center">
                            <span>Analytics</span>
                            {isPlaying && (
                                <span className="text-[10px] uppercase tracking-wide text-orange-500 animate-pulse">
                                    Live
                                </span>
                            )}
                        </h3>
                        <div className="space-y-2.5 font-mono text-[12px]">
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Matches Found</span>
                                <span className="text-[var(--palm)] font-semibold bg-[var(--sand)] px-2 py-0.5 rounded shadow-sm">
                                    {matchedNodeIds.size} / {result.matches?.length || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Nodes Traversed</span>
                                <span className="text-[var(--lagoon-deep)] font-semibold bg-[var(--foam)] border border-[var(--lagoon)]/20 px-2 py-0.5 rounded shadow-sm">
                                    {Math.min(currentFrame + 1, result.visited_count)} / {result.visited_count}
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Time Took</span>
                                <span className="text-[var(--sea-ink)] font-semibold">
                                    {result.duration_ms} ms
                                </span>
                            </div>
                            <div className="flex justify-between text-[var(--sea-ink-soft)] items-center">
                                <span>Max Depth</span>
                                <span className="text-[var(--palm)] font-semibold">
                                    {result.max_depth}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Traversal Log header */}
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h3 className="text-[13px] font-semibold text-[var(--sea-ink)]">
                                Traversal Log
                            </h3>
                            <p className="text-[10px] text-[var(--sea-ink-soft)] mt-0.5">
                                {result.traversal_log?.length ?? 0} steps recorded
                            </p>
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            title="Download log file"
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--lagoon-deep)] border border-[var(--lagoon)]/30 bg-[var(--foam)] hover:bg-[var(--lagoon)]/10 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <span>...</span>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                    </svg>
                                    .log
                                </>
                            )}
                        </button>
                    </div>

                    {/* Log legend */}
                    <div className="px-5 pb-2 flex gap-3 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[10px] text-[var(--sea-ink-soft)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--lagoon)] inline-block" />
                            MATCH
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--sea-ink-soft)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                            Active
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--sea-ink-soft)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                            VISIT
                        </span>
                    </div>

                    {/* Scrollable log rows */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
                        {result.traversal_log?.map((step, idx) => {
                            const isActive = idx === currentFrame;
                            const isPast = idx < currentFrame;
                            return (
                                <div
                                    key={idx}
                                    ref={isActive ? activeLogRowRef : undefined}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-mono text-[11px] transition-colors ${
                                        isActive
                                            ? "bg-orange-50 border border-orange-200"
                                            : step.matched && isPast
                                              ? "bg-[var(--foam)] border border-[var(--lagoon)]/15"
                                              : isPast
                                                ? "opacity-50"
                                                : "opacity-25"
                                    }`}
                                >
                                    {/* Step number */}
                                    <span className="text-[var(--sea-ink-soft)] w-6 text-right flex-shrink-0 tabular-nums">
                                        {idx + 1}
                                    </span>

                                    {/* Active indicator dot */}
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                        isActive
                                            ? "bg-orange-400"
                                            : step.matched
                                              ? "bg-[var(--lagoon)]"
                                              : "bg-slate-300"
                                    }`} />

                                    {/* Tag name */}
                                    <span className={`flex-1 truncate font-semibold ${
                                        isActive
                                            ? "text-orange-700"
                                            : step.matched
                                              ? "text-[var(--lagoon-deep)]"
                                              : "text-[var(--sea-ink)]"
                                    }`}>
                                        {step.tag === "#text" ? '"text"' : `<${step.tag}>`}
                                    </span>

                                    {/* Depth badge */}
                                    <span className="text-[var(--sea-ink-soft)] text-[10px] flex-shrink-0">
                                        d:{step.depth}
                                    </span>

                                    {/* Action badge */}
                                    {step.matched ? (
                                        <span className="text-[10px] font-bold text-[var(--lagoon-deep)] bg-[var(--lagoon)]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                            MATCH
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                                            VISIT
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>
            )}
        </main>
    );
}
