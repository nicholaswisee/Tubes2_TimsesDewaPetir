package scraper

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"golang.org/x/net/html"
)

// Fetches raw HTML from a URL
func FetchHTML(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("fetch error: %w", err)
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	return string(b), err
}

// Converts an HTML string into a DOMNode tree
func Parse(rawHTML string) (*model.DOMNode, error) {
	doc, err := html.Parse(strings.NewReader(rawHTML))
	if err != nil {
		return nil, err
	}
	counter := 0
	return buildNode(doc, 0, &counter), nil
}

func buildNode(n *html.Node, depth int, counter *int) *model.DOMNode {
	if n == nil {
		return nil
	}
	// Skip comment and doctype nodes
	if n.Type == html.CommentNode || n.Type == html.DoctypeNode {
		return nil
	}

	*counter++
	node := &model.DOMNode{
		ID:         *counter,
		Depth:      depth,
		Attributes: make(map[string]string),
	}

	switch n.Type {
	case html.TextNode:
		node.Tag = "#text"
		node.Text = strings.TrimSpace(n.Data)
		if node.Text == "" {
			return nil // skip whitespace-only text nodes
		}
	case html.ElementNode:
		node.Tag = n.Data
		for _, a := range n.Attr {
			node.Attributes[a.Key] = a.Val
		}
	}

	var prevChild *model.DOMNode
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		child := buildNode(c, depth+1, counter)
		if child != nil {
			child.Parent = node
			child.PreviousSibling = prevChild
			node.Children = append(node.Children, child)
			prevChild = child
		}
	}
	return node
}
