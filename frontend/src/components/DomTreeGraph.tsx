import { useCallback, useState } from "react";
import Tree from "react-d3-tree";
import type { RawNodeDatum, CustomNodeElementProps } from "react-d3-tree";
import type { DOMNode } from "../api/types";

interface DomTreeGraphProps {
    tree: DOMNode;
    matchedNodeIds: Set<number>;
}

// Convert our backend DOMNode format into react-d3-tree's required format
function convertToD3Tree(node: DOMNode, matched: Set<number>): RawNodeDatum {
    let name = node.tag;
    let textPreview = "";

    if (node.tag === "#text") {
        textPreview =
            node.text && node.text.length > 25
                ? node.text.substring(0, 25) + "..."
                : node.text;
    }

    const isMatched = matched.has(node.id);

    const attrs: Record<string, string> = {
        _id: node.id.toString(),
        _matched: isMatched.toString(),
        _text: textPreview,
    };

    if (node.tag !== "#text" && node.attributes) {
        if (node.attributes.id) attrs["id"] = "#" + node.attributes.id;
        if (node.attributes.class)
            attrs["class"] = "." + node.attributes.class.split(" ")[0]; // Show first class nicely
    }

    return {
        name,
        attributes: attrs,
        children:
            node.children && node.children.length > 0
                ? node.children.map((c) => convertToD3Tree(c, matched))
                : undefined,
    };
}

const renderCustomNode = ({
    nodeDatum,
    toggleNode,
}: CustomNodeElementProps) => {
    const isMatched = nodeDatum.attributes?._matched === "true";
    const textPreview = nodeDatum.attributes?._text as string;
    const isTextNode = nodeDatum.name === "#text";

    const strokeColor = isMatched ? "#173a40" : "#4fb8b2";
    const strokeWidth = isMatched ? 4 : 2;
    const fillColor = isMatched ? "#4fb8b2" : "#ffffff";
    return (
        <g>
            <circle
                r={15}
                onClick={toggleNode}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                style={{ cursor: "pointer" }}
            />
            <text
                fill={isTextNode ? "#416166" : "#173a40"}
                strokeWidth="1"
                x="20"
                y="-5"
                style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    fontWeight: isMatched ? "bold" : "normal",
                }}
                onClick={toggleNode}
            >
                {isTextNode ? `"${textPreview}"` : `<${nodeDatum.name}>`}
            </text>
            {!isTextNode && (
                <text
                    fill="#328f97"
                    x="20"
                    y="10"
                    style={{ fontSize: "10px", fontFamily: "monospace" }}
                >
                    {nodeDatum.attributes?.id} {nodeDatum.attributes?.class}
                </text>
            )}
        </g>
    );
};

export function DomTreeGraph({ tree, matchedNodeIds }: DomTreeGraphProps) {
    const [zoom] = useState(0.8);

    const d3Data = convertToD3Tree(tree, matchedNodeIds);

    const containerRef = useCallback((containerElem: HTMLDivElement | null) => {
        if (containerElem !== null) {
            const { width, height } = containerElem.getBoundingClientRect();
            containerElem.dataset.width = width.toString();
            containerElem.dataset.height = height.toString();
        }
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
            }}
        >
            <Tree
                data={d3Data}
                renderCustomNodeElement={renderCustomNode}
                orientation="horizontal"
                pathFunc="step"
                zoom={zoom}
                translate={{ x: 50, y: 300 }}
                nodeSize={{ x: 200, y: 70 }}
                separation={{ siblings: 1.2, nonSiblings: 1.5 }}
            />
        </div>
    );
}
