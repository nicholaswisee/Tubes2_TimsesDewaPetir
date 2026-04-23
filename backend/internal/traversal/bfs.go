package traversal

import (
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func BFS(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) ([]*model.DOMNode, []model.TraversalStep, []model.AnimationFrame, int) {
	var matches []*model.DOMNode
	var log []model.TraversalStep
	var frames []model.AnimationFrame
	visited := 0

	if root == nil {
		return matches, log, frames, visited
	}

	queue := []*model.DOMNode{root}
	var matchedIDs []int

	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

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

		queue = append(queue, node.Children...)

		queueIDs := make([]int, len(queue))
		for i, n := range queue {
			queueIDs[i] = n.ID
		}

		copiedMatchedIDs := make([]int, len(matchedIDs))
		copy(copiedMatchedIDs, matchedIDs)

		frames = append(frames, model.AnimationFrame{
			Step:       len(frames),
			ActiveID:   node.ID,
			QueueIDs:   queueIDs,
			StackIDs:   []int{},
			MatchedIDs: copiedMatchedIDs,
		})
	}

	return matches, log, frames, visited
}
