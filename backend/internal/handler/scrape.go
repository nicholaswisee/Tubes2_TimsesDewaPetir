package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/scraper"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/traversal"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.GET("/health", Health)
		api.GET("search", Search)
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

	// Ambil HTML dari raw string atau fetch dari URL
	rawHTML := req.HTML
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
	}

	// Parse HTML menjadi DOM tree
	tree, err := scraper.Parse(rawHTML)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	// Lakukan algoritma traversal yang dipilih (BFS/DFS)
	var result traversal.Result
	switch req.Algorithm {
	case "bfs":
		result = traversal.BFS(tree, req.Selector, req.Limit)
	case "dfs":
		result = traversal.DFS(tree, req.Selector, req.Limit)
	}

	// Kembalikan response
	c.JSON(http.StatusOK, model.SearchResponse{
		Tree:         tree,
		MaxDepth:     result.MaxDepth,
		Matches:      result.Matches,
		VisitedCount: result.VisitedCount,
		DurationMs:   result.DurationMs,
		TraversalLog: result.Log,
	})
}
