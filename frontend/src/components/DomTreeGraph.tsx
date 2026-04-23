import { useCallback, useRef, useState } from "react";
import Tree from "react-d3-tree";
import type { RawNodeDatum, CustomNodeElementProps } from "react-d3-tree";
import type { DOMNode } from "../api/types";

interface DomTreeGraphProps {
    tree: DOMNode;
    matchedNodeIds: Set<number>;
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    tag: string;
    id: string;
    cls: string;
    text: string;
    isMatched: boolean;
    nodeId: string;
}

function convertToD3Tree(node: DOMNode, matched: Set<number>): RawNodeDatum {
    const textPreview =
        node.tag === "#text"
            ? node.text && node.text.length > 60
                ? node.text.substring(0, 60) + "..."
                : node.text || ""
            : "";

    const isMatched = matched.has(node.id);

    const attrs: Record<string, string> = {
        _id: node.id.toString(),
        _matched: isMatched.toString(),
        _text: textPreview,
        _rawId: node.attributes?.id || "",
        _rawClass: node.attributes?.class || "",
    };

    if (node.tag !== "#text" && node.attributes) {
        if (node.attributes.id) attrs["id"] = "#" + node.attributes.id;
        if (node.attributes.class)
            attrs["class"] = "." + node.attributes.class.split(" ")[0];
    }

    return {
        name: node.tag,
        attributes: attrs,
        children:
            node.children && node.children.length > 0
                ? node.children.map((c) => convertToD3Tree(c, matched))
                : undefined,
    };
}

// The node renderer is defined outside so it can receive the tooltip setter
function makeNodeRenderer(
    setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>,
    containerRef: React.RefObject<HTMLDivElement | null>,
) {
    return function CustomNode({
        nodeDatum,
        toggleNode,
    }: CustomNodeElementProps) {
        const isMatched = nodeDatum.attributes?._matched === "true";
        const textPreview = (nodeDatum.attributes?._text as string) || "";
        const isTextNode = nodeDatum.name === "#text";

        const strokeColor = isMatched ? "#173a40" : "#4fb8b2";
        const strokeWidth = isMatched ? 4 : 2;
        const fillColor = isMatched ? "#4fb8b2" : "#ffffff";

        const handleMouseEnter = (e: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setTooltip({
                visible: true,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                tag: nodeDatum.name,
                id: (nodeDatum.attributes?._rawId as string) || "",
                cls: (nodeDatum.attributes?._rawClass as string) || "",
                text: textPreview,
                isMatched,
                nodeId: (nodeDatum.attributes?._id as string) || "",
            });
        };

        const handleMouseMove = (e: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setTooltip((prev) => ({
                ...prev,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }));
        };

        const handleMouseLeave = () => {
            setTooltip((prev) => ({ ...prev, visible: false }));
        };

        return (
            <g
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <circle
                    r={15}
                    onClick={toggleNode}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    style={{ cursor: "pointer" }}
                />
                <text
                    fill="#000000"
                    strokeWidth="0"
                    x="20"
                    y="-5"
                    style={{
                        fontSize: "13px",
                        fontFamily: "monospace",
                        fontWeight: isMatched ? "bold" : "normal",
                        userSelect: "none",
                    }}
                    onClick={toggleNode}
                >
                    {isTextNode ? `"${textPreview}"` : `<${nodeDatum.name}>`}
                </text>
                {!isTextNode && (
                    <text
                        fill="#444444"
                        x="20"
                        y="10"
                        style={{
                            fontSize: "10px",
                            fontFamily: "monospace",
                            userSelect: "none",
                        }}
                    >
                        {nodeDatum.attributes?.id} {nodeDatum.attributes?.class}
                    </text>
                )}
            </g>
        );
    };
}

export function DomTreeGraph({ tree, matchedNodeIds }: DomTreeGraphProps) {
    const [zoom] = useState(0.8);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        tag: "",
        id: "",
        cls: "",
        text: "",
        isMatched: false,
        nodeId: "",
    });

    const d3Data = convertToD3Tree(tree, matchedNodeIds);

    // Stable renderer, recreated only if refs change (which they don't)
    const nodeRenderer = useCallback(
        makeNodeRenderer(setTooltip, containerRef),
        [],
    );

    const setContainerRef = useCallback((el: HTMLDivElement | null) => {
        (
            containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = el;
    }, []);

    return (
        <div
            ref={setContainerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                position: "relative",
            }}
        >
            <Tree
                data={d3Data}
                renderCustomNodeElement={nodeRenderer}
                orientation="horizontal"
                pathFunc="step"
                zoom={zoom}
                translate={{ x: 50, y: 300 }}
                nodeSize={{ x: 200, y: 70 }}
                separation={{ siblings: 1.2, nonSiblings: 1.5 }}
            />

            {/* Hover Tooltip */}
            {tooltip.visible && (
                <div
                    style={{
                        position: "absolute",
                        top: tooltip.y + 16,
                        left: tooltip.x + 16,
                        pointerEvents: "none",
                        zIndex: 9999,
                        transform:
                            tooltip.x > 600 ? "translateX(-110%)" : undefined,
                    }}
                    className="bg-[#0f1c1e] text-white rounded-xl px-4 py-3 text-xs font-mono shadow-2xl border border-[var(--lagoon)]/30 min-w-[180px] max-w-[280px]"
                >
                    {/* Tag pill */}
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                                tooltip.tag === "#text"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : tooltip.isMatched
                                      ? "bg-[var(--lagoon)]/30 text-[#7ee8e4]"
                                      : "bg-[var(--lagoon)]/15 text-[#4fb8b2]"
                            }`}
                        >
                            {tooltip.tag === "#text"
                                ? "#text"
                                : `<${tooltip.tag}>`}
                        </span>
                        {tooltip.isMatched && (
                            <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                                matched
                            </span>
                        )}
                    </div>

                    {/* Node ID */}
                    <div className="text-[var(--sea-ink-soft)] text-[10px] mb-1.5">
                        Node #{tooltip.nodeId}
                    </div>

                    {/* Attributes */}
                    {tooltip.id && (
                        <div className="flex gap-1.5 items-start mb-1">
                            <span className="text-[#4fb8b2] shrink-0">#id</span>
                            <span className="text-slate-300 break-all">
                                {tooltip.id}
                            </span>
                        </div>
                    )}
                    {tooltip.cls && (
                        <div className="flex gap-1.5 items-start mb-1">
                            <span className="text-[#a8d8b9] shrink-0">
                                .cls
                            </span>
                            <span className="text-slate-300 break-all">
                                {tooltip.cls}
                            </span>
                        </div>
                    )}
                    {tooltip.text && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                            <span className="text-amber-400/70 text-[10px] block mb-0.5">
                                text content
                            </span>
                            <span className="text-slate-400 italic break-all">
                                &ldquo;{tooltip.text}&rdquo;
                            </span>
                        </div>
                    )}
                    {!tooltip.id && !tooltip.cls && !tooltip.text && (
                        <div className="text-slate-500 italic text-[10px]">
                            No attributes
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
