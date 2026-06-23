package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "http://localhost:8080/api/v1/ws/notifications?ticket=foo", nil)
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Sec-WebSocket-Version", "13")
	req.Header.Set("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	fmt.Println("Status:", resp.Status)
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println("Body:", string(body))
}
