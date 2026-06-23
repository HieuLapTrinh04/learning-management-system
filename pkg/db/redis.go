package db

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"context"
	"fmt"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/redis/go-redis/v9"
)

// InitRedis initializes the go-redis client connection.
func InitRedis(cfg *config.Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0, // Use default DB
	})

	// Test connection using Ping
	ctx := context.Background()
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to connect to Redis: %v", err)
	}

	logger.Log.Sugar().Infoln("Successfully connected to Redis!")
	return rdb
}
