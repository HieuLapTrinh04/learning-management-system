# Stage 1: Build stage
FROM golang:1.26-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy dependency files and fetch them
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source code
COPY . .

# Build the Go application statically
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o lms-api ./cmd/api/main.go

# Stage 2: Final lightweight runner stage
FROM alpine:3.19

# Set target directory
WORKDIR /app

# Install chromium and required dependencies for headless Chrome (chromedp)
# Also add ca-certificates and fonts for proper PDF rendering
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    font-noto

# Set environment variable so chromedp knows where to find chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy the statically compiled binary from the builder stage
COPY --from=builder /app/lms-api .

# Create the uploads directories and set appropriate permissions
RUN mkdir -p uploads/certificates

# Expose backend REST port
EXPOSE 8080

# Command to run the application
CMD ["./lms-api"]
