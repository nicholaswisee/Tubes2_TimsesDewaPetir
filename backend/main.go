package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/handler"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/scraper"
)

func printTree(node *model.DOMNode, indent string) {
	if node == nil {
		return
	}

	// Output the Tag and maybe Text so we see it parsing correctly
	output := fmt.Sprintf("%s<%s>", indent, node.Tag)
	if node.Tag == "#text" {
		text := node.Text
		if len(text) > 30 {
			text = text[:27] + "..."
		}
		output = fmt.Sprintf("%s\"%s\"", indent, strings.ReplaceAll(text, "\n", " "))
	}
	fmt.Println(output)

	for _, child := range node.Children {
		printTree(child, indent+"  ")
	}
}

func main() {
	//	testing scraperrr
	url := "https://example.com"
	fmt.Printf("Fetching HTML from: %s\n", url)

	htmlContent, err := scraper.FetchHTML(url)
	if err != nil {
		log.Fatalf("Failed to fetch: %v", err)
	}

	fmt.Printf("Successfully Fetched %d bytes.\n", len(htmlContent))
	fmt.Println("Parsing into DOM Tree...")

	treeRoot, err := scraper.Parse(htmlContent)
	if err != nil {
		log.Fatalf("Failed to parse DOM: %v", err)
	}

	fmt.Println("\nDOM TREE")
	printTree(treeRoot, "")

	r := gin.Default()

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routing
	handler.RegisterRoutes(r)

	// Server runs on localhost:8080 and blocks infinitely
	fmt.Println("Starting Gin server on :8080...")
	r.Run(":8080")
}
