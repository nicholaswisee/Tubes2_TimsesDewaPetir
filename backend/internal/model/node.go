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
	NodeID  int    `json:"node_id"`
	Tag     string `json:"tag"`
	Depth   int    `json:"depth"`
	Matched bool   `json:"matched"` // match CSS selector
}

type SearchRequest struct {
	URL       string `json:"url"`
	HTML      string `json:"html"` // raw HTML string
	Algorithm string `json:"algorithm" binding:"required,oneof=bfs dfs"`
	Selector  string `json:"selector"`
	Limit     int    `json:"limit"` // 0 = all, N = top N results
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
	Tree            *DOMNode         `json:"tree"` 
	MaxDepth        int              `json:"max_depth"`
	Matches         []*DOMNode       `json:"matches"` 
	VisitedCount    int              `json:"visited_count"`
	DurationMs      int64            `json:"duration_ms"`
	TraversalLog    []TraversalStep  `json:"traversal_log"`    
	AnimationFrames []AnimationFrame `json:"animation_frames"` 
}
