FROM golang:1.26-alpine AS base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

#  builder stage 
FROM base AS builder
COPY . .

# Limit parallelism to 1 and set memory limit to 512MB to avoid OOM on small VMs
RUN GOMEMLIMIT=512MiB CGO_ENABLED=0 GOOS=linux go build -p 1 -o server ./main.go

#  final production stage 
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]

#  dev stage (moved to end so it's skipped during prod build)
FROM base AS dev
RUN go install github.com/air-verse/air@latest
CMD ["air"]
