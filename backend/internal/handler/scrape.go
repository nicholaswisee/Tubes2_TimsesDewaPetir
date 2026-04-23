package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
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

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.GET("/health", Health)
		api.POST("/search", Search)
		api.GET("/log/latest", DownloadLatestLog)
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

	// Save traversal log to file (non-blocking)
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
		Tree:            tree,
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
