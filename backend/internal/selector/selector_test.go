package selector

import (
	"testing"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func TestParseSelector(t *testing.T) {
	nodeC := &model.DOMNode{Tag: "span", Attributes: map[string]string{"class": "text highlight", "id": "s1"}}
	nodeB := &model.DOMNode{Tag: "div", Attributes: map[string]string{"class": "container"}, Children: []*model.DOMNode{nodeC}}
	nodeA := &model.DOMNode{Tag: "body", Children: []*model.DOMNode{nodeB}}
	nodeC.Parent = nodeB
	nodeB.Parent = nodeA

	nodeD := &model.DOMNode{Tag: "a", Attributes: map[string]string{"href": "https://google.com"}}
	nodeA.Children = append(nodeA.Children, nodeD)
	nodeD.Parent = nodeA
	nodeD.PreviousSibling = nodeB

	tests := []struct {
		selector string
		node     *model.DOMNode
		expected bool
	}{
		{"span", nodeC, true},
		{".highlight", nodeC, true},
		{"#s1", nodeC, true},
		{"div > span", nodeC, true},
		{"body span", nodeC, true},
		{"body > span", nodeC, false},
		{"div + a", nodeD, true},
		{"div ~ a", nodeD, true},
		{"[href^=\"https\"]", nodeD, true},
		{"span, a", nodeD, true},
		{"span, a", nodeC, true},
		{"div.container", nodeB, true},
		{"span.text.highlight#s1", nodeC, true},
	}

	for _, tt := range tests {
		t.Run(tt.selector, func(t *testing.T) {
			matcher := ParseSelector(tt.selector)
			if got := matcher.Match(tt.node); got != tt.expected {
				t.Errorf("selector %q on %s returned %v, expected %v", tt.selector, tt.node.Tag, got, tt.expected)
			}
		})
	}
}
