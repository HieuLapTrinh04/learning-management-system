package config

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"


	"github.com/spf13/viper"
)

type Config struct {
	Port                   string `mapstructure:"PORT"`
	Env                    string `mapstructure:"ENV"`
	DBHost                 string `mapstructure:"DB_HOST"`
	DBPort                 string `mapstructure:"DB_PORT"`
	DBUser                 string `mapstructure:"DB_USER"`
	DBPassword             string `mapstructure:"DB_PASSWORD"`
	DBName                 string `mapstructure:"DB_NAME"`
	RedisHost              string `mapstructure:"REDIS_HOST"`
	RedisPort              string `mapstructure:"REDIS_PORT"`
	RedisPassword          string `mapstructure:"REDIS_PASSWORD"`
	JWTAccessSecret        string `mapstructure:"JWT_ACCESS_SECRET"`
	JWTRefreshSecret       string `mapstructure:"JWT_REFRESH_SECRET"`
	JWTAccessExpiryMinutes int    `mapstructure:"JWT_ACCESS_EXPIRY_MINUTES"`
	JWTRefreshExpiryDays   int    `mapstructure:"JWT_REFRESH_EXPIRY_DAYS"`
	CloudinaryCloudName    string `mapstructure:"CLOUDINARY_CLOUD_NAME"`
	CloudinaryAPIKey       string `mapstructure:"CLOUDINARY_API_KEY"`
	CloudinaryAPISecret    string `mapstructure:"CLOUDINARY_API_SECRET"`
	VNPayTmnCode           string `mapstructure:"VNP_TMN_CODE"`
	VNPayHashSecret        string `mapstructure:"VNP_HASH_SECRET"`
	VNPayURL               string `mapstructure:"VNP_URL"`
	VNPayReturnURL         string `mapstructure:"VNP_RETURN_URL"`
	VNPayAPIURL            string `mapstructure:"VNP_API_URL"`
	ResendAPIKey           string `mapstructure:"RESEND_API_KEY"`
	EmailFromAddress       string `mapstructure:"EMAIL_FROM_ADDRESS"`
}

func LoadConfig(path string) *Config {
	viper.SetConfigFile(path)
	viper.AutomaticEnv()

	// Default values
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "3306")
	viper.SetDefault("DB_USER", "lms_user")
	viper.SetDefault("DB_PASSWORD", "lms_password")
	viper.SetDefault("DB_NAME", "lms_db")
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("JWT_ACCESS_SECRET", "access_secret")
	viper.SetDefault("JWT_REFRESH_SECRET", "refresh_secret")
	viper.SetDefault("JWT_ACCESS_EXPIRY_MINUTES", 15)
	viper.SetDefault("JWT_REFRESH_EXPIRY_DAYS", 7)

	if err := viper.ReadInConfig(); err != nil {
		logger.Log.Sugar().Infof("Warning: cannot read config file %s, relying on environment variables: %v", path, err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		logger.Log.Sugar().Fatalf("Unable to decode into config struct, %v", err)
	}

	return &config
}
