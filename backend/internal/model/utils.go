package model

func MaxDepth(root *DOMNode) int {
	if root == nil {
		return 0
	}
	max := root.Depth
	for _, child := range root.Children {
		childMax := MaxDepth(child)
		if childMax > max {
			max = childMax
		}
	}
	return max
}
