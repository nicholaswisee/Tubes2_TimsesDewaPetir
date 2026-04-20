package selector

import (
	"strings"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func Matches(node *model.DOMNode, selector string) bool {
	selector = strings.TrimSpace(selector)
	if selector == "" {
		return true
	}

	leftStr, rightStr, combinator, found := splitLastCombinator(selector)

	// Evaluate the right-most side against the current node
	if !matchesSingle(node, rightStr) {
		return false
	}

	// If there is no left side, we fully matched the selector
	if !found {
		return true
	}

	// Otherwise, evaluate the relationship based on the combinator
	switch combinator {
	case '>':
		if node.Parent != nil && Matches(node.Parent, leftStr) {
			return true
		}
	case ' ':
		curr := node.Parent
		for curr != nil {
			if Matches(curr, leftStr) {
				return true
			}
			curr = curr.Parent
		}
	case '+':
		if node.PreviousSibling != nil && Matches(node.PreviousSibling, leftStr) {
			return true
		}
	case '~':
		curr := node.PreviousSibling
		for curr != nil {
			if Matches(curr, leftStr) {
				return true
			}
			curr = curr.PreviousSibling
		}
	}

	return false
}

func matchesSingle(node *model.DOMNode, selector string) bool {
	selector = strings.TrimSpace(selector)
	if selector == "" || selector == "*" {
		return true
	}

	// ID selector: #header
	if strings.HasPrefix(selector, "#") {
		return node.Attributes["id"] == selector[1:]
	}

	// Class selector: .box
	if strings.HasPrefix(selector, ".") {
		classes := strings.Fields(node.Attributes["class"])
		for _, c := range classes {
			if c == selector[1:] {
				return true
			}
		}
		return false
	}

	// Attribute selector: [type="text"] or [required]
	if strings.HasPrefix(selector, "[") && strings.HasSuffix(selector, "]") {
		inner := selector[1 : len(selector)-1]
		if idx := strings.Index(inner, "="); idx != -1 {
			key, val := inner[:idx], inner[idx+1:]
			val = strings.Trim(val, "\"'") // remove quotes around value if any
			return node.Attributes[key] == val
		}
		_, ok := node.Attributes[inner]
		return ok
	}

	// Compound selector: p.class or a#id or div[attr]
	idx := -1
	for i, c := range selector {
		if i == 0 {
			continue // skip first character
		}
		if c == '.' || c == '#' || c == '[' {
			idx = i
			break
		}
	}

	if idx > 0 {
		tag := selector[:idx]
		rest := selector[idx:]
		// Tag must match AND the remainder must match
		return node.Tag == tag && matchesSingle(node, rest)
	}

	// Plain Tag selector
	return node.Tag == selector
}

func splitLastCombinator(s string) (left, right string, combinator rune, found bool) {
	inBracket := 0

	// Walk backwards to find the last combinator
	for i := len(s) - 1; i >= 0; i-- {
		c := s[i]

		if c == ']' {
			inBracket++
			continue
		}
		if c == '[' {
			inBracket--
			continue
		}
		// ignore anything inside attributes like [href="a > b"]
		if inBracket > 0 {
			continue
		}

		if c == '>' || c == '+' || c == '~' {
			return strings.TrimSpace(s[:i]), strings.TrimSpace(s[i+1:]), rune(c), true
		}

		if c == ' ' {
			j := i
			for j >= 0 && s[j] == ' ' {
				j--
			}
			if j >= 0 {
				prevC := s[j]
				if prevC == '>' || prevC == '+' || prevC == '~' {
					i = j + 1
					continue
				}
			}

 			return strings.TrimSpace(s[:i]), strings.TrimSpace(s[i+1:]), ' ', true
		}
	}

	return "", s, 0, false
}
