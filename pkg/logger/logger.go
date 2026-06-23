package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Log *zap.Logger

// InitLogger initializes the global Zap logger with lumberjack log rotation.
func InitLogger() {
	// 1. Configure lumberjack for log rotation
	logWriter := zapcore.AddSync(&lumberjack.Logger{
		Filename:   "logs/app.log",
		MaxSize:    10, // megabytes
		MaxBackups: 3,  // maximum number of old log files to retain
		MaxAge:     28, // days
		Compress:   true, // compress rotated log files
	})

	// 2. Configure encoder (JSON format)
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "timestamp"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder // Human readable timestamp
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	jsonEncoder := zapcore.NewJSONEncoder(encoderConfig)

	// 3. Configure console encoder for terminal output (easier debugging during dev)
	consoleEncoder := zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())

	// 4. Create cores
	// Core for writing to file (JSON)
	fileCore := zapcore.NewCore(jsonEncoder, logWriter, zap.InfoLevel)
	// Core for writing to terminal (Console)
	consoleCore := zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), zap.DebugLevel)

	// 5. Combine cores
	core := zapcore.NewTee(fileCore, consoleCore)

	// 6. Create Logger
	Log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))

	// Replace global zap logger (optional, allows zap.L() usage)
	zap.ReplaceGlobals(Log)
}

// Sync flushes any buffered log entries (should be called before app exits)
func Sync() {
	if Log != nil {
		_ = Log.Sync()
	}
}
