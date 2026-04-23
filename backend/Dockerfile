FROM golang:1.26-alpine AS base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

#  dev stage
FROM base AS dev
RUN go install github.com/air-verse/air@latest
CMD ["air"]

#  builder stage 
FROM base AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go

#  final production stage 
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
