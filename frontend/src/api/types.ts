export interface DOMNode {
  id: number;
  tag: string;
  attributes: Record<string, string>;
  text: string;
  depth: number;
  children: DOMNode[];
}

export interface TraversalStep {
  node_id: number;
  parent_id: number; // -1 for root
  tag: string;
  depth: number;
  matched: boolean;
}

export interface SearchRequest {
  url: string;
  html?: string;
  algorithm: 'bfs' | 'dfs';
  selector: string;
  limit: number;
  parallel?: boolean;
}

export interface AnimationFrame {
  step: number;
  active_id: number;
  queue_ids: number[];
  stack_ids: number[];
  matched_ids: number[];
}

export interface SearchResponse {
  max_depth: number;
  matches: DOMNode[];
  visited_count: number;
  duration_ms: number;
  traversal_log: TraversalStep[];
  animation_frames: AnimationFrame[];
}

export interface LCARequest {
  traversal_id_1: number; // 1-indexed position in traversal log
  traversal_id_2: number;
}

export interface LCAResponse {
  lca_node_id: number;
  lca_tag: string;
  lca_depth: number;
  lca_traversal_id: number; // 1-indexed; -1 if not found in log
  node1_node_id: number;
  node2_node_id: number;
  path_ids: number[]; // DOM node IDs on the path node1 → LCA → node2
}
