package model

// individual DOM Node
type DOMNode struct {
	ID              int               `json:"id"`
	Tag             string            `json:"tag"`
	Attributes      map[string]string `json:"attributes"`
	Text            string            `json:"text"`
	Depth           int               `json:"depth"`
	Children        []*DOMNode        `json:"children"`
	Parent          *DOMNode          `json:"-"` // Added for Combinators
	PreviousSibling *DOMNode          `json:"-"` // Added for Combinators
}

type TraversalStep struct {
	NodeID   int    `json:"node_id"`
	ParentID int    `json:"parent_id"` // -1 for root
	Tag      string `json:"tag"`
	Depth    int    `json:"depth"`
	Matched  bool   `json:"matched"` // match CSS selector
}

type SearchRequest struct {
	URL       string `json:"url"`
	HTML      string `json:"html"` // raw HTML string
	Algorithm string `json:"algorithm" binding:"required,oneof=bfs dfs"`
	Selector  string `json:"selector"`
	Limit     int    `json:"limit"`    // 0 = all, N = top N results
	Parallel  bool   `json:"parallel"` // true = use parallel (multithreaded) variant
}

type AnimationFrame struct {
	Step       int   `json:"step"`        
	ActiveID   int   `json:"active_id"`   
	QueueIDs   []int `json:"queue_ids"`   
	StackIDs   []int `json:"stack_ids"`   	
	MatchedIDs []int `json:"matched_ids"` 	
}

// SearchResponse is returned by POST /api/search.
type SearchResponse struct {
	MaxDepth        int              `json:"max_depth"`
	Matches         []*DOMNode       `json:"matches"`
	VisitedCount    int              `json:"visited_count"`
	DurationMs      int64            `json:"duration_ms"`
	TraversalLog    []TraversalStep  `json:"traversal_log"`
	AnimationFrames []AnimationFrame `json:"animation_frames"`
}

// LCARequest is the body for POST /api/lca.
// IDs are 1-indexed positions in the last traversal log.
type LCARequest struct {
	TraversalID1 int `json:"traversal_id_1" binding:"required,min=1"`
	TraversalID2 int `json:"traversal_id_2" binding:"required,min=1"`
}

// LCAResponse is returned by POST /api/lca.
type LCAResponse struct {
	LCANodeID      int    `json:"lca_node_id"`
	LCATag         string `json:"lca_tag"`
	LCADepth       int    `json:"lca_depth"`
	LCATraversalID int    `json:"lca_traversal_id"` // 1-indexed; -1 if not in log
	Node1NodeID    int    `json:"node1_node_id"`
	Node2NodeID    int    `json:"node2_node_id"`
	PathIDs        []int  `json:"path_ids"` // DOM node IDs forming the path node1→LCA→node2
}
