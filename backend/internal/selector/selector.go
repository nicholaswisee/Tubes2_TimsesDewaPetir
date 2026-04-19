package selector

import (
	"strings"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func Matches(node *model.DOMNode, selector string) bool {
	selector = strings.TrimSpace(selector)
	if selector == "" || selector == "=" {
		return true
	}

	if strings.HasPrefix(selector, "#") {
		return node.Attributes["id"] == selector[1:]

	}

	if strings.HasPrefix(selector, ".") {
		classes := strings.Fields(node.Attributes["class"])
		for _, c := range classes {
			if c == selector[1:] {
				return true
			}
		}
		return false
	}

	if strings.HasPrefix(selector, "[") && strings.HasSuffix(selector, "]") {
		inner := selector[1 : len(selector)-1]
		if idx := strings.Index(inner, "="); idx != -1 {
			key, val := inner[:idx], inner[idx+1:]
			return node.Attributes[key] == val
		}
		_, ok := node.Attributes[inner]
		return ok
	}

	// --- tag.class or tag#id compound ---
	if i := strings.IndexAny(selector, ".#"); i > 0 {
		tag := selector[:i]
		rest := selector[i:]
		return node.Tag == tag && Matches(node, rest)
	}

	// --- plain tag ---
	return node.Tag == selector
}
