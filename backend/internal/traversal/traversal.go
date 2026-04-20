package traversal

import (
	"time"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/selector"
)

type Result struct {
	Matches      []*model.DOMNode
	VisitedCount int
	DurationMs   int64
	Log          []model.TraversalStep
	MaxDepth     int
}

// BFS menelusuri pohon DOM level by level (melebar dulu)
// Menggunakan antrian (slice): node diambil dari depan, children ditambah ke belakang
func BFS(root *model.DOMNode, sel string, limit int) Result {
	start := time.Now()
	var matches []*model.DOMNode
	var log []model.TraversalStep
	maxDepth := 0
	visited := 0

	antrian := []*model.DOMNode{root}
	for len(antrian) > 0 {
		// Ambil node dari antrian terdepan
		node := antrian[0]
		antrian = antrian[1:]

		visited++
		if node.Depth > maxDepth {
			maxDepth = node.Depth
		}

		matched := selector.Matches(node, sel)
		log = append(log, model.TraversalStep{
			NodeID:  node.ID,
			Tag:     node.Tag,
			Depth:   node.Depth,
			Matched: matched,
		})

		if matched {
			matches = append(matches, node)
			// Berhenti jika sudah mencapai batas hasil yang diinginkan
			if limit > 0 && len(matches) >= limit {
				break
			}
		}

		// Menambahkan semua anak node ke belakang antrian
		antrian = append(antrian, node.Children...)
	}

	return Result{
		Matches:      matches,
		VisitedCount: visited,
		DurationMs:   time.Since(start).Milliseconds(),
		Log:          log,
		MaxDepth:     maxDepth,
	}
}

// DFS menelurusi pohon DOM secara mendalam dulu
// Menggunakan stack explicit instead of rekursi karena menghindari stack overflow pada DOM yang sangat dalam
func DFS(root *model.DOMNode, sel string, limit int) Result {
	start := time.Now()
	var matches []*model.DOMNode
	var log []model.TraversalStep
	maxDepth := 0
	visited := 0

	// Children di push secara terbalik supaya anak paling kiri diproses duluan
	stack := []*model.DOMNode{root}
	for len(stack) > 0 {
		// Ambil node dari atas stack
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		visited++
		if node.Depth > maxDepth {
			maxDepth = node.Depth
		}

		matched := selector.Matches(node, sel)
		log = append(log, model.TraversalStep{
			NodeID:  node.ID,
			Tag:     node.Tag,
			Depth:   node.Depth,
			Matched: matched,
		})

		if matched {
			matches = append(matches, node)
			// Berhenti kalau udah mencapai batas hasil yang diinginkan
			if limit > 0 && len(matches) >= limit {
				break
			}
		}

		// Push children secara terbalik biar anak paling kiri ada di atas stack
		for i := len(node.Children) - 1; i >= 0; i-- {
			stack = append(stack, node.Children[i])
		}
	}

	return Result{
		Matches:      matches,
		VisitedCount: visited,
		DurationMs:   time.Since(start).Milliseconds(),
		Log:          log,
		MaxDepth:     maxDepth,
	}
}
