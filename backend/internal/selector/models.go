package selector

import "github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"

// Matcher evaluates if a DOMNode matches parsed conditions.
type Matcher interface {
	Match(node *model.DOMNode) bool
}

// GroupMatcher handles comma separated A, B
type GroupMatcher struct {
	Matchers []Matcher
}

// Combinator handles relationship matchers
type CombinatorMatcher struct {
	Left  Matcher
	Right Matcher
	Op    rune // ' ', '>', '+', '~'
}

// CompoundMatcher handles e.g. div.class#id[attr]
type CompoundMatcher struct {
	Tag        string
	ID         string
	Classes    []string
	Attributes []AttributeMatch
}

type AttributeMatch struct {
	Key      string
	Operator string // "", "=", "~=", "^=", "$=", "*="
	Value    string
}
