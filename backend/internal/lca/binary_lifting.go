package lca

import "github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"

// LOG controls the maximum ancestor depth: 2^LOG levels.
// 18 supports trees up to 262144 nodes deep.
const LOG = 18

// Table holds the binary lifting structure for O(log n) LCA queries.
type Table struct {
	depth map[int]int
	up    map[int][]int // up[nodeID][k] = 2^k-th ancestor's nodeID
	byID  map[int]*model.DOMNode
}

// Build constructs the binary lifting table from a DOM tree in O(n log n).
func Build(root *model.DOMNode) *Table {
	t := &Table{
		depth: make(map[int]int),
		up:    make(map[int][]int),
		byID:  make(map[int]*model.DOMNode),
	}

	// BFS to enumerate all nodes, set depth and direct parent (up[v][0]).
	queue := []*model.DOMNode{root}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

		t.byID[node.ID] = node
		t.depth[node.ID] = node.Depth

		row := make([]int, LOG)
		// Initialize all levels to self — ensures root and over-lifted nodes stay at root.
		for k := range row {
			row[k] = node.ID
		}
		if node.Parent != nil {
			row[0] = node.Parent.ID
		}
		t.up[node.ID] = row

		queue = append(queue, node.Children...)
	}

	// Fill binary lifting table: up[v][k] = up[up[v][k-1]][k-1].
	// Each level k reads from the already-complete level k-1, so map iteration
	// order does not affect correctness.
	for k := 1; k < LOG; k++ {
		for _, row := range t.up {
			// row is a slice header copy; modifying row[k] modifies the underlying array.
			row[k] = t.up[row[k-1]][k-1]
		}
	}

	return t
}

// Query returns the LCA node ID of u and v. Returns (0, false) if either ID is unknown.
func (t *Table) Query(u, v int) (int, bool) {
	if _, ok := t.byID[u]; !ok {
		return 0, false
	}
	if _, ok := t.byID[v]; !ok {
		return 0, false
	}

	du, dv := t.depth[u], t.depth[v]

	// Bring the deeper node up to the same depth as the shallower one.
	if du < dv {
		u, v = v, u
		du, dv = dv, du
	}
	diff := du - dv
	rowU := t.up[u]
	for k := 0; k < LOG; k++ {
		if (diff>>k)&1 == 1 {
			u = rowU[k]
			rowU = t.up[u]
		}
	}

	if u == v {
		return u, true
	}

	// Lift both nodes simultaneously until their ancestors diverge.
	for k := LOG - 1; k >= 0; k-- {
		if t.up[u][k] != t.up[v][k] {
			u = t.up[u][k]
			v = t.up[v][k]
		}
	}

	return t.up[u][0], true
}

// NodeByID returns the DOMNode with the given ID.
func (t *Table) NodeByID(id int) (*model.DOMNode, bool) {
	node, ok := t.byID[id]
	return node, ok
}

// PathToAncestor returns the slice of node IDs from nodeID up to ancestorID (inclusive).
// Requires that ancestorID is actually an ancestor of nodeID.
func (t *Table) PathToAncestor(nodeID, ancestorID int) []int {
	node, ok := t.byID[nodeID]
	if !ok {
		return nil
	}
	ancestor, ok := t.byID[ancestorID]
	if !ok {
		return nil
	}

	var path []int
	curr := node
	for curr != nil && curr.ID != ancestor.ID {
		path = append(path, curr.ID)
		curr = curr.Parent
	}
	if curr != nil {
		path = append(path, ancestor.ID)
	}
	return path
}
