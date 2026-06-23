package ws

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type Client struct {
	UserID uint
	Conn   *websocket.Conn
}

type NotificationMessage struct {
	UserID  uint
	Payload []byte
}

type Hub struct {
	clients    map[uint]map[*websocket.Conn]bool
	register   chan Client
	unregister chan Client
	broadcast  chan NotificationMessage
	redis      *redis.Client
}

func NewHub(redisClient *redis.Client) *Hub {
	return &Hub{
		clients:    make(map[uint]map[*websocket.Conn]bool),
		register:   make(chan Client),
		unregister: make(chan Client),
		broadcast:  make(chan NotificationMessage, 256),
		redis:      redisClient,
	}
}

func (h *Hub) GenerateTicket(ctx context.Context, userID uint) (string, error) {
	if h.redis == nil {
		return "", errors.New("redis not configured for ws tickets")
	}
	ticket := uuid.New().String()
	err := h.redis.Set(ctx, "ws_ticket:"+ticket, userID, 15*time.Second).Err()
	return ticket, err
}

func (h *Hub) VerifyTicket(ctx context.Context, ticket string) (uint, error) {
	if h.redis == nil {
		return 0, errors.New("redis not configured for ws tickets")
	}
	// GetDel fetches and deletes atomically
	val, err := h.redis.GetDel(ctx, "ws_ticket:"+ticket).Uint64()
	if err != nil {
		return 0, errors.New("invalid or expired ticket")
	}
	return uint(val), nil
}

func (h *Hub) Register(userID uint, conn *websocket.Conn) {
	h.register <- Client{UserID: userID, Conn: conn}
}

func (h *Hub) Unregister(userID uint, conn *websocket.Conn) {
	h.unregister <- Client{UserID: userID, Conn: conn}
}

func (h *Hub) Broadcast(userID uint, payload []byte) {
	// Publish to Redis instead of direct local broadcast
	if h.redis != nil {
		msg := NotificationMessage{UserID: userID, Payload: payload}
		data, _ := json.Marshal(msg)
		h.redis.Publish(context.Background(), "ws_notifications", data)
	} else {
		// Fallback to local
		h.broadcast <- NotificationMessage{UserID: userID, Payload: payload}
	}
}

func (h *Hub) Run() {
	logger.Log.Sugar().Infoln("WebSocket Hub is running...")

	// Listen to Redis Pub/Sub
	if h.redis != nil {
		go func() {
			pubsub := h.redis.Subscribe(context.Background(), "ws_notifications")
			ch := pubsub.Channel()
			for msg := range ch {
				var nMsg NotificationMessage
				if err := json.Unmarshal([]byte(msg.Payload), &nMsg); err == nil {
					h.broadcast <- nMsg
				}
			}
		}()
	}

	for {
		select {
		case client := <-h.register:
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*websocket.Conn]bool)
			}
			h.clients[client.UserID][client.Conn] = true
			logger.Log.Sugar().Infof("User %d connected on WS. Total connections for user: %d", client.UserID, len(h.clients[client.UserID]))

		case client := <-h.unregister:
			if conns, exists := h.clients[client.UserID]; exists {
				if _, ok := conns[client.Conn]; ok {
					delete(conns, client.Conn)
					_ = client.Conn.Close()
					logger.Log.Sugar().Infof("User %d disconnected from WS. Connections remaining: %d", client.UserID, len(conns))
					if len(conns) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}

		case message := <-h.broadcast:
			if conns, exists := h.clients[message.UserID]; exists {
				for conn := range conns {
					err := conn.WriteMessage(websocket.TextMessage, message.Payload)
					if err != nil {
						logger.Log.Sugar().Infof("Failed to write WS message to user %d, closing conn: %v", message.UserID, err)
						_ = conn.Close()
						delete(conns, conn)
					}
				}
				if len(conns) == 0 {
					delete(h.clients, message.UserID)
				}
			}
		}
	}
}
