package main

import (
	"fmt"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/handler"
)

func main() {
	r := gin.Default()

	// Baca origin frontend dari environment variable, default ke localhost:3000
	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}

	// Izinkan request dari frontend (CORS)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Daftarkan semua route
	handler.RegisterRoutes(r)

	// Jalankan server di port 8080
	fmt.Println("Server berjalan di :8080...")
	r.Run(":8080")
}
