package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/scraper"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.GET("/health", Health)
		api.GET("getdom", GetDom)
	}
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func GetDom(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url query param required"})
		return
	}

	html, err := scraper.FetchHTML(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"length":  len(html),
		"preview": html[:min(300, len(html))], // first 300 chars
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
