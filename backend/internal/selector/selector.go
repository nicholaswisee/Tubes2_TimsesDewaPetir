package selector

import (
	"strings"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

func (g *GroupMatcher) Match(node *model.DOMNode) bool {
	for _, m := range g.Matchers {
		if m.Match(node) {
			return true
		}
	}
	return false
}

func (c *CombinatorMatcher) Match(node *model.DOMNode) bool {
	if !c.Right.Match(node) {
		return false
	}
	switch c.Op {
	case '>':
		return node.Parent != nil && c.Left.Match(node.Parent)
	case ' ':
		curr := node.Parent
		for curr != nil {
			if c.Left.Match(curr) {
				return true
			}
			curr = curr.Parent
		}
	case '+':
		return node.PreviousSibling != nil && c.Left.Match(node.PreviousSibling)
	case '~':
		curr := node.PreviousSibling
		for curr != nil {
			if c.Left.Match(curr) {
				return true
			}
			curr = curr.PreviousSibling
		}
	}
	return false
}

func (m *CompoundMatcher) Match(node *model.DOMNode) bool {
	if m.Tag != "" && m.Tag != "*" && m.Tag != node.Tag {
		return false
	}
	if m.ID != "" && node.Attributes["id"] != m.ID {
		return false
	}
	for _, cls := range m.Classes {
		if !hasClass(node.Attributes["class"], cls) {
			return false
		}
	}
	for _, attr := range m.Attributes {
		val, exists := node.Attributes[attr.Key]
		if !exists {
			return false
		}
		if attr.Operator == "" {
			continue
		}
		switch attr.Operator {
		case "=":
			if val != attr.Value {
				return false
			}
		case "~=":
			if !hasWord(val, attr.Value) {
				return false
			}
		case "^=":
			if !strings.HasPrefix(val, attr.Value) {
				return false
			}
		case "$=":
			if !strings.HasSuffix(val, attr.Value) {
				return false
			}
		case "*=":
			if !strings.Contains(val, attr.Value) {
				return false
			}
		}
	}
	return true
}

func hasClass(classStr, target string) bool {
	for _, class := range strings.Fields(classStr) {
		if class == target {
			return true
		}
	}
	return false
}

func hasWord(str, target string) bool {
	for _, word := range strings.Fields(str) {
		if word == target {
			return true
		}
	}
	return false
}

// ParseSelector compiles a CSS selector string into Matcher
func ParseSelector(selector string) Matcher {
	selector = strings.TrimSpace(selector)
	if selector == "" {
		return &CompoundMatcher{Tag: "*"}
	}

	parts := splitOutsideBrackets(selector, ',')
	if len(parts) > 1 {
		group := &GroupMatcher{}
		for _, part := range parts {
			group.Matchers = append(group.Matchers, ParseSelector(part))
		}
		return group
	}

	leftStr, rightStr, combinator, found := splitLastCombinator(selector)
	if found {
		return &CombinatorMatcher{
			Left:  ParseSelector(leftStr),
			Right: parseCompound(rightStr),
			Op:    combinator,
		}
	}

	return parseCompound(selector)
}

func parseCompound(s string) Matcher {
	s = strings.TrimSpace(s)
	if s == "" {
		return &CompoundMatcher{Tag: "*"}
	}
	m := &CompoundMatcher{}

	i := 0
	for i < len(s) {
		c := s[i]
		if c == '.' {
			end := findTokenEnd(s, i+1)
			m.Classes = append(m.Classes, s[i+1:end])
			i = end
		} else if c == '#' {
			end := findTokenEnd(s, i+1)
			m.ID = s[i+1 : end]
			i = end
		} else if c == '[' {
			end := strings.Index(s[i:], "]")
			if end == -1 {
				end = len(s[i:])
			}
			attrStr := s[i+1 : i+end]
			m.Attributes = append(m.Attributes, parseAttr(attrStr))
			i = i + end + 1
		} else {
			end := findTokenEnd(s, i)
			m.Tag = s[i:end]
			i = end
		}
	}
	return m
}

func parseAttr(s string) AttributeMatch {
	match := AttributeMatch{}
	ops := []string{"~=", "^=", "$=", "*=", "="}
	for _, op := range ops {
		if idx := strings.Index(s, op); idx != -1 {
			match.Key = strings.TrimSpace(s[:idx])
			match.Operator = op
			match.Value = strings.Trim(strings.TrimSpace(s[idx+len(op):]), `"'`)
			return match
		}
	}
	match.Key = strings.TrimSpace(s)
	return match
}

func findTokenEnd(s string, start int) int {
	for i := start; i < len(s); i++ {
		c := s[i]
		if c == '.' || c == '#' || c == '[' {
			return i
		}
	}
	return len(s)
}

func splitOutsideBrackets(s string, sep rune) []string {
	var res []string
	inBracket := 0
	last := 0
	for i, c := range s {
		if c == '[' {
			inBracket++
		}
		if c == ']' {
			inBracket--
		}
		if inBracket == 0 && c == sep {
			res = append(res, strings.TrimSpace(s[last:i]))
			last = i + 1
		}
	}
	res = append(res, strings.TrimSpace(s[last:]))
	return res
}

func splitLastCombinator(s string) (left, right string, combinator rune, found bool) {
	inBracket := 0
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
