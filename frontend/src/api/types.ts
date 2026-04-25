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
