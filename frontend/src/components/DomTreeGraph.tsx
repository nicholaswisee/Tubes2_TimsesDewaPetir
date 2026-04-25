import { useMemo, useCallback, createContext, useContext } from "react";
import {
    ReactFlow,
    Background,
    MiniMap,
    Handle,
    Position,
    useReactFlow,
    ReactFlowProvider,
    type Node,
    type Edge,
    type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import type { TraversalStep } from "../api/types";

// Animation state lives in context — completely decoupled from node data.
// This means the static nodes array NEVER changes after initial build,
// so React Flow does zero per-frame diffing.
interface AnimState {
    activeNodeId?: number;
    matchedNodeIds: Set<number>;
    trackingIds: Set<number>;
}

const AnimContext = createContext<AnimState>({
    activeNodeId: undefined,
    matchedNodeIds: new Set(),
    trackingIds: new Set(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface DomTreeGraphProps {
    log: TraversalStep[];
    activeNodeId?: number;
    matchedNodeIds: Set<number>;
    trackingIds?: Set<number>;
}

interface DomNodeData extends Record<string, unknown> {
    tag: string;
    nodeId: number;
    depth: number;
}

const NODE_W = 140;
const NODE_H = 36;

// ─── Custom Node ──────────────────────────────────────────────────────────────

function DomNode({ data }: NodeProps<Node<DomNodeData>>) {
    // Reads animation state from context — not from node.data.
    // Re-renders only when context changes AND this node is visible in viewport.
    const { activeNodeId, matchedNodeIds, trackingIds } = useContext(AnimContext);
    const { tag, nodeId, depth } = data;

    const isActive = nodeId === activeNodeId;
    const isMatched = matchedNodeIds.has(nodeId);
    const isTracked = trackingIds.has(nodeId);

    let bg = "#ffffff";
    let border = "#4fb8b2";
    let borderWidth = 1.5;
    let textColor = "#173a40";
    let shadow = "0 1px 3px rgba(0,0,0,0.08)";

    if (isActive) {
        bg = "#ffedd5";
        border = "#ea580c";
        borderWidth = 3;
        textColor = "#9a3412";
        shadow = "0 0 0 3px rgba(234,88,12,0.2)";
    } else if (isMatched) {
        bg = "#4fb8b2";
        border = "#173a40";
        borderWidth = 3;
        textColor = "#ffffff";
        shadow = "0 0 0 3px rgba(79,184,178,0.25)";
    } else if (isTracked) {
        bg = "#f0f9ff";
        border = "#38bdf8";
    }

    const label = tag === "#text" ? "#text" : `<${tag}>`;

    return (
        <>
            <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
            <div
                style={{
                    background: bg,
                    border: `${borderWidth}px solid ${border}`,
                    color: textColor,
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    fontWeight: isActive || isMatched ? 700 : 400,
                    width: NODE_W,
                    height: NODE_H,
                    display: "flex",
                    alignItems: "center",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    boxShadow: shadow,
                }}
                title={`<${tag}> · Node #${nodeId} · depth ${depth}`}
            >
                {label}
            </div>
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
        </>
    );
}

// nodeTypes must be defined outside the component to avoid React Flow warnings
const nodeTypes = { domNode: DomNode };

// ─── Layout builder ───────────────────────────────────────────────────────────

// Runs once per search (memoized on [log]).
// Produces static nodes + edges — never updated again during animation.
function buildLayout(log: TraversalStep[]): { nodes: Node<DomNodeData>[]; edges: Edge[] } {
    if (log.length === 0) return { nodes: [], edges: [] };

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 20, ranksep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    const rawNodes: Node<DomNodeData>[] = [];
    const edges: Edge[] = [];

    for (const step of log) {
        const id = String(step.node_id);
        g.setNode(id, { width: NODE_W, height: NODE_H });
        rawNodes.push({
            id,
            type: "domNode",
            position: { x: 0, y: 0 },
            data: { tag: step.tag, nodeId: step.node_id, depth: step.depth },
        });

        if (step.parent_id !== -1) {
            const src = String(step.parent_id);
            g.setEdge(src, id);
            edges.push({
                id: `e${src}-${id}`,
                source: src,
                target: id,
                type: "smoothstep",
                style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
            });
        }
    }

    dagre.layout(g);

    return {
        nodes: rawNodes.map((node) => {
            const pos = g.node(node.id);
            return { ...node, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
        }),
        edges,
    };
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ nodeCount }: { nodeCount: number }) {
    const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();

    const btn =
        "w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#173a40] hover:bg-[#f0fdfc] hover:border-[#4fb8b2] transition text-sm font-bold shadow-sm active:scale-95 cursor-pointer";

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#e2e8f0] rounded-xl px-2 py-1.5 shadow-lg select-none">
            <button className={btn} onClick={() => zoomIn({ duration: 200 })} title="Zoom in">+</button>
            <button className={btn} onClick={() => zoomOut({ duration: 200 })} title="Zoom out">−</button>
            <button
                onClick={() => zoomTo(1, { duration: 300 })}
                title="Reset zoom to 100%"
                className="h-8 px-2.5 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#173a40] hover:bg-[#f0fdfc] hover:border-[#4fb8b2] transition text-[10px] font-semibold shadow-sm active:scale-95 cursor-pointer"
            >
                100%
            </button>
            <div className="w-px h-5 bg-[#e2e8f0] mx-0.5" />
            <button
                onClick={() => fitView({ duration: 400, padding: 0.15 })}
                title="Fit entire tree to view"
                className="h-8 px-3 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#173a40] hover:bg-[#f0fdfc] hover:border-[#4fb8b2] transition text-[11px] font-semibold shadow-sm active:scale-95 cursor-pointer"
            >
                Fit Tree
            </button>
            <div className="w-px h-5 bg-[#e2e8f0] mx-0.5" />
            <span className="text-[10px] font-mono text-[#64748b] px-1 tabular-nums">
                {nodeCount} nodes
            </span>
        </div>
    );
}

// ─── Inner canvas (needs ReactFlowProvider as ancestor) ──────────────────────

function FlowCanvas({ log, activeNodeId, matchedNodeIds, trackingIds }: DomTreeGraphProps) {
    // Static layout — built once, passed as-is to ReactFlow every render.
    // ReactFlow receives the same array reference → zero internal diffing per frame.
    const { nodes, edges } = useMemo(() => buildLayout(log), [log]);

    const animState = useMemo<AnimState>(
        () => ({
            activeNodeId,
            matchedNodeIds,
            trackingIds: trackingIds ?? new Set(),
        }),
        [activeNodeId, matchedNodeIds, trackingIds],
    );

    const nodeColor = useCallback(
        (node: Node) => {
            const id = (node.data as DomNodeData).nodeId;
            if (id === activeNodeId) return "#ea580c";
            if (matchedNodeIds.has(id)) return "#4fb8b2";
            if (trackingIds?.has(id)) return "#38bdf8";
            return "#e2e8f0";
        },
        [activeNodeId, matchedNodeIds, trackingIds],
    );

    return (
        <AnimContext.Provider value={animState}>
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.15 }}
                    minZoom={0.02}
                    maxZoom={2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#f1f5f9" gap={24} size={1.5} />
                    <MiniMap
                        nodeColor={nodeColor}
                        maskColor="rgba(241,245,249,0.7)"
                        style={{ border: "1px solid #e2e8f0", borderRadius: 10, bottom: 60 }}
                        pannable
                        zoomable
                    />
                </ReactFlow>
                <Toolbar nodeCount={log.length} />
            </div>
        </AnimContext.Provider>
    );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function DomTreeGraph(props: DomTreeGraphProps) {
    return (
        <ReactFlowProvider>
            <FlowCanvas {...props} />
        </ReactFlowProvider>
    );
}
