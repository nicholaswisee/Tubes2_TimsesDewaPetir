package traversal

import (
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func DFS(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) ([]*model.DOMNode, []model.TraversalStep, []model.AnimationFrame, int) {
	var matches []*model.DOMNode
	var log []model.TraversalStep
	var frames []model.AnimationFrame
	visited := 0

	if root == nil {
		return matches, log, frames, visited
	}

	stack := []*model.DOMNode{root}
	var matchedIDs []int

	for len(stack) > 0 {
		// Pop from top of stack
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		visited++

		matched := match(node)
		log = append(log, model.TraversalStep{
			NodeID:  node.ID,
			Tag:     node.Tag,
			Depth:   node.Depth,
			Matched: matched,
		})

		if matched {
			if limit == 0 || len(matches) < limit {
				matches = append(matches, node)
				matchedIDs = append(matchedIDs, node.ID)
			}
		}

		// Push children in reverse order so the first child is popped first
		for i := len(node.Children) - 1; i >= 0; i-- {
			stack = append(stack, node.Children[i])
		}

		// Capture Animation Frame
		stackIDs := make([]int, len(stack))
		for i, n := range stack {
			stackIDs[i] = n.ID
		}

		copiedMatchedIDs := make([]int, len(matchedIDs))
		copy(copiedMatchedIDs, matchedIDs)

		frames = append(frames, model.AnimationFrame{
			Step:       len(frames),
			ActiveID:   node.ID,
			QueueIDs:   []int{},
			StackIDs:   stackIDs,
			MatchedIDs: copiedMatchedIDs,
		})
	}

	return matches, log, frames, visited
}
