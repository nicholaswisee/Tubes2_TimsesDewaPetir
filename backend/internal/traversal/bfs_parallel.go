package traversal

import (
	"sync"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

type bfsNodeResult struct {
	node    *model.DOMNode
	step    model.TraversalStep
	matched bool
}

// BFSParallel runs a level-synchronized parallel BFS.
// All nodes at the same depth level are evaluated concurrently via goroutines.
// Results are collected in deterministic (index-within-level) order after each level completes.
func BFSParallel(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) (
	[]*model.DOMNode, []model.TraversalStep, []model.AnimationFrame, int,
) {
	if root == nil {
		return nil, nil, nil, 0
	}

	var (
		allMatches  []*model.DOMNode
		allLog      []model.TraversalStep
		allFrames   []model.AnimationFrame
		matchedIDs  []int
		visitedCount int
	)

	currentLevel := []*model.DOMNode{root}

	for len(currentLevel) > 0 {
		levelSize := len(currentLevel)
		// Pre-allocate indexed by position — goroutine i writes results[i] only, no race.
		results := make([]bfsNodeResult, levelSize)

		var wg sync.WaitGroup
		wg.Add(levelSize)
		for i, node := range currentLevel {
			i, node := i, node // capture loop variables
			go func() {
				defer wg.Done()
				matched := match(node) // pure CSS matcher — goroutine-safe
				results[i] = bfsNodeResult{
					node:    node,
					matched: matched,
					step: model.TraversalStep{
						NodeID:  node.ID,
						Tag:     node.Tag,
						Depth:   node.Depth,
						Matched: matched,
					},
				}
			}()
		}
		wg.Wait()

		// Sequential post-processing: collect log, matches, and next level in index order.
		var nextLevel []*model.DOMNode
		for _, res := range results {
			allLog = append(allLog, res.step)
			if res.matched && (limit == 0 || len(allMatches) < limit) {
				allMatches = append(allMatches, res.node)
				matchedIDs = append(matchedIDs, res.node.ID)
			}
			nextLevel = append(nextLevel, res.node.Children...)
		}

		// Build animation frames sequentially, reconstructing the queue snapshot for each node.
		// Queue at the moment node[i] is "active" = remaining nodes in this level + children of nodes 0..i.
		childrenSoFar := 0
		for i, res := range results {
			childrenThisNode := len(res.node.Children)

			var queueSnap []int
			for _, n := range currentLevel[i+1:] {
				queueSnap = append(queueSnap, n.ID)
			}
			for _, n := range nextLevel[:childrenSoFar+childrenThisNode] {
				queueSnap = append(queueSnap, n.ID)
			}
			childrenSoFar += childrenThisNode

			copiedMatchedIDs := make([]int, len(matchedIDs))
			copy(copiedMatchedIDs, matchedIDs)

			allFrames = append(allFrames, model.AnimationFrame{
				Step:       len(allFrames),
				ActiveID:   res.node.ID,
				QueueIDs:   queueSnap,
				StackIDs:   []int{},
				MatchedIDs: copiedMatchedIDs,
			})
		}

		visitedCount += levelSize
		currentLevel = nextLevel
	}

	return allMatches, allLog, allFrames, visitedCount
}
