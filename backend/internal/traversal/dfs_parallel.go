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

func sequentialDFSSubtree(root *model.DOMNode, match func(*model.DOMNode) bool) dfsSubtreeResult {
	var res dfsSubtreeResult
	var localMatchedIDs []int

	stack := []*model.DOMNode{root}

	for len(stack) > 0 {
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		res.visited++
		matched := match(node)

		parentID := -1
		if node.Parent != nil {
			parentID = node.Parent.ID
		}
		res.log = append(res.log, model.TraversalStep{
			NodeID:   node.ID,
			ParentID: parentID,
			Tag:      node.Tag,
			Depth:    node.Depth,
			Matched:  matched,
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

func DFSParallel(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) (
	[]*model.DOMNode, []model.TraversalStep, []model.AnimationFrame, int,
) {
	if root == nil {
		return nil, nil, nil, 0
	}
	if len(root.Children) <= 1 {
		return DFS(root, match, limit)
	}

	var (
		allMatches   []*model.DOMNode
		allLog       []model.TraversalStep
		allFrames    []model.AnimationFrame
		visitedCount int
	)

	visitedCount = 1
	rootMatched := match(root)
	var rootMatchedIDs []int
	if rootMatched {
		allMatches = append(allMatches, root)
		rootMatchedIDs = append(rootMatchedIDs, root.ID)
	}
	allLog = append(allLog, model.TraversalStep{
		NodeID:   root.ID,
		ParentID: -1,
		Tag:      root.Tag,
		Depth:    root.Depth,
		Matched:  rootMatched,
	})

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

	children := root.Children
	subtreeResults := make([]dfsSubtreeResult, len(children))
	var wg sync.WaitGroup
	wg.Add(len(children))
	for i, child := range children {
		i, child := i, child
		go func() {
			defer wg.Done()
			subtreeResults[i] = sequentialDFSSubtree(child, match)
		}()
	}
	wg.Wait()

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

	frameOffsets := make([]int, len(children))

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

	if limit > 0 && len(allMatches) > limit {
		allMatches = allMatches[:limit]
	}

	return allMatches, allLog, allFrames, visitedCount
}
