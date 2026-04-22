package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/handler"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/scraper"
)

func printDOMTree(node *model.DOMNode, indentLevel int) {
	if node == nil {
		return
	}
	
	indent := strings.Repeat("  ", indentLevel)
	if node.Tag == "#text" {
		// print a short preview of the text
		text := node.Text
		if len(text) > 40 {
			text = text[:37] + "..."
		}
		// replace newlines for single-line display
		text = strings.ReplaceAll(text, "\n", " ")
		fmt.Printf("%s\"%s\"\n", indent, text)
	} else {
		// print tag and attributes
		attrs := []string{}
		for k, v := range node.Attributes {
			attrs = append(attrs, fmt.Sprintf("%s=\"%s\"", k, v))
		}
		attrStr := ""
		if len(attrs) > 0 {
			attrStr = " " + strings.Join(attrs, " ")
		}
		fmt.Printf("%s<%s%s>\n", indent, node.Tag, attrStr)
	}

	for _, child := range node.Children {
		printDOMTree(child, indentLevel+1)
	}
}

func main() {
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

	handler.RegisterRoutes(r)

	fmt.Println("\n--- Initialization: Testing DOM Printer with an Example URL ---")
	testURL := "https://example.com"
	fmt.Printf("Fetching and Parsing: %s\n", testURL)
	rawHTML, err := scraper.FetchHTML(testURL)
	if err == nil {
		tree, err := scraper.Parse(rawHTML)
		if err == nil {
			fmt.Println("Successfully parsed DOM Tree. Structure:")
			printDOMTree(tree, 0)
			fmt.Println("\n--- End DOM Print ---")
		} else {
			fmt.Printf("Failed to parse DOM: %v\n", err)
		}
	} else {
		fmt.Printf("Failed to fetch HTML: %v\n", err)
	}
	fmt.Println("---------------------------------------------------------------")

	fmt.Println("Server berjalan di :8080...")
	r.Run(":8080")
}
