package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nicholaswisee/Tubes2_TimsesDewaPetir/backend/internal/model"
)

const logsDir = "logs"

// SaveTraversalLog writes a traversal log file and returns its path.
func SaveTraversalLog(
	algorithm, selector, source string,
	steps []model.TraversalStep,
	matchCount, visitedCount int,
	maxDepth int,
	durationMs int64,
) (string, error) {
	if err := os.MkdirAll(logsDir, 0o755); err != nil {
		return "", fmt.Errorf("failed to create logs dir: %w", err)
	}

	ts := time.Now()
	filename := fmt.Sprintf("traversal_%s.log", ts.Format("20060102_150405"))
	path := filepath.Join(logsDir, filename)

	f, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("failed to create log file: %w", err)
	}
	defer f.Close()

	w := func(format string, args ...any) {
		fmt.Fprintf(f, format, args...)
	}

	w("=== DOM Traversal Log ===\n")
	w("Timestamp    : %s\n", ts.Format("2006-01-02 15:04:05"))
	w("Algorithm    : %s\n", strings.ToUpper(algorithm))
	w("CSS Selector : %s\n", selectorDisplay(selector))
	w("Source       : %s\n", source)
	w("Max Depth    : %d\n", maxDepth)
	w("\n")

	w("--- Traversal Steps ---\n")
	w("%-6s | %-7s | %-20s | %-5s | %s\n", "Step", "NodeID", "Tag", "Depth", "Action")
	w("%s\n", strings.Repeat("-", 58))

	for i, step := range steps {
		action := "VISIT"
		if step.Matched {
			action = "MATCH ← CSS selector matched"
		}
		w("%-6d | %-7d | %-20s | %-5d | %s\n",
			i+1, step.NodeID, step.Tag, step.Depth, action)
	}

	w("\n--- Summary ---\n")
	w("Total Nodes Visited  : %d\n", visitedCount)
	w("Total Matches Found  : %d\n", matchCount)
	w("Search Duration (ms) : %d\n", durationMs)

	return path, nil
}

func selectorDisplay(s string) string {
	if s == "" {
		return "* (all elements)"
	}
	return s
}
