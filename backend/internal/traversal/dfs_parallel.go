package traversal

import (
	"sync"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

type dfsSubtreeResult struct {
	matches []*model.DOMNode
	log     []model.TraversalStep
	frames  []model.AnimationFrame
	visited int
}

// sequentialDFSSubtree runs a full sequential DFS on the subtree rooted at node.
// It is called from multiple goroutines — each goroutine works on a disjoint subtree,
// so there is no shared state between goroutine invocations.
func sequentialDFSSubtree(root *model.DOMNode, match func(*model.DOMNode) bool) dfsSubtreeResult {
	var res dfsSubtreeResult
	var localMatchedIDs []int

	stack := []*model.DOMNode{root}

	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		res.visited++
		matched := match(node)

		res.log = append(res.log, model.TraversalStep{
			NodeID:  node.ID,
			Tag:     node.Tag,
			Depth:   node.Depth,
			Matched: matched,
		})

		if matched {
			res.matches = append(res.matches, node)
			localMatchedIDs = append(localMatchedIDs, node.ID)
		}

		// Push children in reverse order so left child is processed first.
		for i := len(node.Children) - 1; i >= 0; i-- {
			stack = append(stack, node.Children[i])
		}

		stackIDs := make([]int, len(stack))
		for i, n := range stack {
			stackIDs[i] = n.ID
		}
		copiedMatchedIDs := make([]int, len(localMatchedIDs))
		copy(copiedMatchedIDs, localMatchedIDs)

		// Step is a local index; will be renumbered globally during merge.
		res.frames = append(res.frames, model.AnimationFrame{
			Step:       len(res.frames),
			ActiveID:   node.ID,
			QueueIDs:   []int{},
			StackIDs:   stackIDs,
			MatchedIDs: copiedMatchedIDs,
		})
	}

	return res
}

// DFSParallel runs a subtree-parallel DFS.
// The root node is processed first sequentially. Then one goroutine is spawned per child of root,
// each running a complete sequential DFS on its assigned subtree.
// Results are merged in child order (deterministic), then truncated to limit.
//
// Correctness guarantee: because goroutines work on disjoint subtrees and results are merged
// in child order, the final matches list is identical to sequential DFS (same nodes, same order).
func DFSParallel(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) (
	[]*model.DOMNode, []model.TraversalStep, []model.AnimationFrame, int,
) {
	if root == nil {
		return nil, nil, nil, 0
	}
	// Not worth parallelizing when root has 0 or 1 children.
	if len(root.Children) <= 1 {
		return DFS(root, match, limit)
	}

	var (
		allMatches  []*model.DOMNode
		allLog      []model.TraversalStep
		allFrames   []model.AnimationFrame
		visitedCount int
	)

	// Process root first (sequential, single step).
	visitedCount = 1
	rootMatched := match(root)
	var rootMatchedIDs []int
	if rootMatched {
		allMatches = append(allMatches, root)
		rootMatchedIDs = append(rootMatchedIDs, root.ID)
	}
	allLog = append(allLog, model.TraversalStep{
		NodeID:  root.ID,
		Tag:     root.Tag,
		Depth:   root.Depth,
		Matched: rootMatched,
	})

	// Root's stack-after-processing = its children (top-of-stack = children[0]).
	rootStackIDs := make([]int, len(root.Children))
	for i, c := range root.Children {
		rootStackIDs[i] = c.ID
	}
	copiedRoot := make([]int, len(rootMatchedIDs))
	copy(copiedRoot, rootMatchedIDs)
	allFrames = append(allFrames, model.AnimationFrame{
		Step:       0,
		ActiveID:   root.ID,
		QueueIDs:   []int{},
		StackIDs:   rootStackIDs,
		MatchedIDs: copiedRoot,
	})

	// Spawn one goroutine per child of root.
	children := root.Children
	subtreeResults := make([]dfsSubtreeResult, len(children))
	var wg sync.WaitGroup
	wg.Add(len(children))
	for i, child := range children {
		i, child := i, child
		go func() {
			defer wg.Done()
			// No limit passed: collect all matches, truncate after merge for correctness.
			subtreeResults[i] = sequentialDFSSubtree(child, match)
		}()
	}
	wg.Wait()

	// Build prefix match-ID sets for each subtree (needed for MatchedIDs correction).
	// prefixIDs[k] = root matches + all matches from subtrees 0..k-1
	prefixIDs := make([][]int, len(children))
	running := make([]int, len(rootMatchedIDs))
	copy(running, rootMatchedIDs)
	for i, sub := range subtreeResults {
		prefixIDs[i] = make([]int, len(running))
		copy(prefixIDs[i], running)
		for _, m := range sub.matches {
			running = append(running, m.ID)
		}
	}

	// Track where each subtree's frames start in allFrames (for the correction pass).
	frameOffsets := make([]int, len(children))

	// Merge subtree results in child order.
	for i, sub := range subtreeResults {
		visitedCount += sub.visited
		allLog = append(allLog, sub.log...)
		allMatches = append(allMatches, sub.matches...)

		frameOffsets[i] = len(allFrames)
		for _, f := range sub.frames {
			f.Step = len(allFrames)
			allFrames = append(allFrames, f)
		}
	}

	// Post-processing: fix MatchedIDs so each frame shows cumulative global matches.
	// For subtree[k], every frame's MatchedIDs must be prepended with prefixIDs[k].
	for i, sub := range subtreeResults {
		prefix := prefixIDs[i]
		for j := range sub.frames {
			gIdx := frameOffsets[i] + j
			local := allFrames[gIdx].MatchedIDs
			combined := make([]int, 0, len(prefix)+len(local))
			combined = append(combined, prefix...)
			combined = append(combined, local...)
			allFrames[gIdx].MatchedIDs = combined
		}
	}

	// Truncate matches to limit AFTER merge (guarantees same order as sequential DFS).
	if limit > 0 && len(allMatches) > limit {
		allMatches = allMatches[:limit]
	}

	return allMatches, allLog, allFrames, visitedCount
}
