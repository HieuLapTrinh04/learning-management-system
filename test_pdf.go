package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

func main() {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.NoSandbox,
		chromedp.Headless,
		chromedp.DisableGPU,
	)

	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	htmlContent := "<html><body><h1>Test PDF</h1></body></html>"

	var buf []byte
	err := chromedp.Run(ctx,
		chromedp.Navigate("data:text/html,charset=utf-8,"+htmlContent),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			buf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithLandscape(true).
				WithPaperWidth(11.0).
				WithPaperHeight(8.5).
				WithMarginTop(0).
				WithMarginBottom(0).
				WithMarginLeft(0).
				WithMarginRight(0).
				Do(ctx)
			return err
		}),
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Generated PDF size: %d bytes\n", len(buf))
	ioutil.WriteFile("test.pdf", buf, 0644)
}
