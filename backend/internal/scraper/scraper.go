package scraper

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"golang.org/x/net/html"
)

func FetchHTML(url string) (string, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("request creation error: %w", err)
	}

	// Set a realistic User-Agent to bypass bot protection
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch error: %w", err)
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	return string(b), err
}

func Parse(rawHTML string) (*model.DOMNode, error) {
	z := html.NewTokenizer(strings.NewReader(rawHTML))

	counter := 0
	root := &model.DOMNode{
		ID:         counter,
		Tag:        "document",
		Depth:      0,
		Attributes: make(map[string]string),
	}
	stack := []*model.DOMNode{root}
	var lastAppended map[int]*model.DOMNode
	lastAppended = make(map[int]*model.DOMNode)

	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			if z.Err() == io.EOF {
				break
			}
			return nil, z.Err()
		}

		switch tt {
		case html.StartTagToken, html.SelfClosingTagToken:
			t := z.Token()
			counter++
			node := &model.DOMNode{
				ID:         counter,
				Tag:        t.Data,
				Depth:      len(stack),
				Attributes: make(map[string]string),
			}
			for _, a := range t.Attr {
				node.Attributes[a.Key] = a.Val
			}

			parent := stack[len(stack)-1]
			node.Parent = parent

			if prev, ok := lastAppended[parent.ID]; ok {
				node.PreviousSibling = prev
			}
			parent.Children = append(parent.Children, node)
			lastAppended[parent.ID] = node

			if tt == html.StartTagToken {
				stack = append(stack, node)
				lastAppended[node.ID] = nil
			}

		case html.EndTagToken:
			t := z.Token()
			// Pop the stack until we find the matching tag
			for i := len(stack) - 1; i > 0; i-- {
				if stack[i].Tag == t.Data {
					stack = stack[:i]
					break
				}
			}

		case html.TextToken:
			t := z.Token()
			text := strings.TrimSpace(t.Data)
			if text == "" {
				continue
			}

			counter++
			node := &model.DOMNode{
				ID:         counter,
				Tag:        "#text",
				Text:       text,
				Depth:      len(stack),
				Attributes: make(map[string]string),
			}

			parent := stack[len(stack)-1]
			node.Parent = parent
			if prev, ok := lastAppended[parent.ID]; ok {
				node.PreviousSibling = prev
			}
			parent.Children = append(parent.Children, node)
			lastAppended[parent.ID] = node

		case html.CommentToken, html.DoctypeToken:
		}
	}

	realRootChildren := 0
	var htmlRoot *model.DOMNode
	for _, c := range root.Children {
		if c.Tag != "#text" && c.Tag != "document" {
			realRootChildren++
			if c.Tag == "html" {
				htmlRoot = c
			}
		}
	}

	// if there's exactly one true <html> tag, we can just return it, otherwise return the wrapper
	if realRootChildren == 1 && htmlRoot != nil {
		htmlRoot.Parent = nil
		htmlRoot.Depth = 0

		fixDepths(htmlRoot, 0)
		return htmlRoot, nil
	}

	return root, nil
}

func fixDepths(node *model.DOMNode, depth int) {
	node.Depth = depth
	for _, c := range node.Children {
		fixDepths(c, depth+1)
	}
}
