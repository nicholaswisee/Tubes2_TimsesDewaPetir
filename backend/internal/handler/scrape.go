package handler

import (
	"fmt"
	"net/http"
	"sort"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/lca"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/logger"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/scraper"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/selector"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/traversal"
)

var LastParsedTree *model.DOMNode

var (
	latestLogMu   sync.RWMutex
	latestLogPath string
)

// lcaMu guards all "latest search" state used by LCA and HTML endpoints.
var (
	lcaMu           sync.RWMutex
	latestTraversal []model.TraversalStep
	latestLCATable  *lca.Table
	latestRawHTML   string
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.GET("/health", Health)
		api.POST("/search", Search)
		api.GET("/log/latest", DownloadLatestLog)
		api.POST("/lca", LCA)
		api.GET("/html/latest", GetLatestHTML)
	}
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func Search(c *gin.Context) {
	var req model.SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rawHTML := req.HTML
	source := fmt.Sprintf("HTML: (raw input)")
	if rawHTML == "" {
		if req.URL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "isi URL atau HTML"})
			return
		}
		fetched, err := scraper.FetchHTML(req.URL)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		rawHTML = fetched
		source = fmt.Sprintf("URL: %s", req.URL)
	}

	tree, err := scraper.Parse(rawHTML)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	LastParsedTree = tree

	astMatcher := selector.ParseSelector(req.Selector)
	matchFunc := func(node *model.DOMNode) bool {
		return astMatcher.Match(node)
	}

	start := time.Now()
	var matches []*model.DOMNode
	var log []model.TraversalStep
	var frames []model.AnimationFrame
	var visitedCount int

	switch req.Algorithm {
	case "bfs":
		if req.Parallel {
			matches, log, frames, visitedCount = traversal.BFSParallel(tree, matchFunc, req.Limit)
		} else {
			matches, log, frames, visitedCount = traversal.BFS(tree, matchFunc, req.Limit)
		}
	case "dfs":
		if req.Parallel {
			matches, log, frames, visitedCount = traversal.DFSParallel(tree, matchFunc, req.Limit)
		} else {
			matches, log, frames, visitedCount = traversal.DFS(tree, matchFunc, req.Limit)
		}
	}
	durationMs := time.Since(start).Milliseconds()

	maxDepth := model.MaxDepth(tree)

	// Build binary lifting table synchronously (fast even for large trees).
	table := lca.Build(tree)

	lcaMu.Lock()
	latestTraversal = log
	latestLCATable = table
	latestRawHTML = rawHTML
	lcaMu.Unlock()

	// Save traversal log to file (non-blocking).
	go func() {
		path, saveErr := logger.SaveTraversalLog(
			req.Algorithm,
			req.Selector,
			source,
			log,
			len(matches),
			visitedCount,
			maxDepth,
			durationMs,
		)
		if saveErr == nil {
			latestLogMu.Lock()
			latestLogPath = path
			latestLogMu.Unlock()
		}
	}()

	c.JSON(http.StatusOK, model.SearchResponse{
		MaxDepth:        maxDepth,
		Matches:         matches,
		VisitedCount:    visitedCount,
		DurationMs:      durationMs,
		TraversalLog:    log,
		AnimationFrames: frames,
	})
}

func DownloadLatestLog(c *gin.Context) {
	latestLogMu.RLock()
	path := latestLogPath
	latestLogMu.RUnlock()

	if path == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "no log available yet — run a search first"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=traversal_log.log")
	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.File(path)
}

func LCA(c *gin.Context) {
	var req model.LCARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lcaMu.RLock()
	traversalLog := latestTraversal
	table := latestLCATable
	lcaMu.RUnlock()

	if table == nil || len(traversalLog) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no traversal available — run a search first"})
		return
	}

	n := len(traversalLog)
	if req.TraversalID1 > n || req.TraversalID2 > n {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("traversal ID out of range (1–%d)", n),
		})
		return
	}

	step1 := traversalLog[req.TraversalID1-1]
	step2 := traversalLog[req.TraversalID2-1]

	lcaNodeID, ok := table.Query(step1.NodeID, step2.NodeID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "LCA computation failed"})
		return
	}

	lcaNode, _ := table.NodeByID(lcaNodeID)

	// Find the 1-indexed traversal position of the LCA node.
	lcaTraversalID := -1
	for i, step := range traversalLog {
		if step.NodeID == lcaNodeID {
			lcaTraversalID = i + 1
			break
		}
	}

	// Build path IDs: node1→LCA and node2→LCA, merged into a sorted unique set.
	path1 := table.PathToAncestor(step1.NodeID, lcaNodeID)
	path2 := table.PathToAncestor(step2.NodeID, lcaNodeID)

	seen := make(map[int]bool)
	for _, id := range path1 {
		seen[id] = true
	}
	for _, id := range path2 {
		seen[id] = true
	}
	pathIDs := make([]int, 0, len(seen))
	for id := range seen {
		pathIDs = append(pathIDs, id)
	}
	sort.Ints(pathIDs)

	c.JSON(http.StatusOK, model.LCAResponse{
		LCANodeID:      lcaNodeID,
		LCATag:         lcaNode.Tag,
		LCADepth:       lcaNode.Depth,
		LCATraversalID: lcaTraversalID,
		Node1NodeID:    step1.NodeID,
		Node2NodeID:    step2.NodeID,
		PathIDs:        pathIDs,
	})
}

func GetLatestHTML(c *gin.Context) {
	lcaMu.RLock()
	html := latestRawHTML
	lcaMu.RUnlock()

	if html == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "no HTML available yet — run a search first"})
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
