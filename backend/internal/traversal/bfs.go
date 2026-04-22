package traversal

import (
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func BFS(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) ([]*model.DOMNode, []model.TraversalStep, int) {
	var matches []*model.DOMNode
	var log []model.TraversalStep
	visited := 0

	if root == nil {
		return matches, log, visited
	}

	queue := []*model.DOMNode{root}
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
			}
		}

		queue = append(queue, node.Children...)
	}

	return matches, log, visited
}
