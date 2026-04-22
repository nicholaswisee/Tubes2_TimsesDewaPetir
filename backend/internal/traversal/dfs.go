package traversal

import (
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

// DFS performs an iterative Depth-First Search on the DOMNode tree using a stack.
func DFS(root *model.DOMNode, match func(*model.DOMNode) bool, limit int) ([]*model.DOMNode, []model.TraversalStep, int) {
	var matches []*model.DOMNode
	var log []model.TraversalStep
	visited := 0

	if root == nil {
		return matches, log, visited
	}

	stack := []*model.DOMNode{root}

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
			}
		}

		// Push children in reverse order so the first child is popped first (left-to-right evaluation)
		for i := len(node.Children) - 1; i >= 0; i-- {
			stack = append(stack, node.Children[i])
		}
	}

	return matches, log, visited
}
