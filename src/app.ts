import * as https from "https";
import { IncomingMessage } from "http";
/*
    TODOS:
        1. [DONE] Fetch a price from API
        2. [DONE] Run regex to get the price from that API call
        3. Store the resulting price in a local file
        4. Adapt above to loop over list of stocks
        5. Make regex work for each stock by substituting stock name
        6. Make process interuptable
*/

// API Link:
// https://www.google.com/async/finance_wholepage_price_updates?ei=AkRUXrqGAZKP8gLipYzoDQ&yv=3&async=mids:%2Fm%2F0ckhqlx,currencies:,_fmt:jspb

class StockFetcher {

    //Properties
    private static readonly URL = "https://www.google.com/async/finance_wholepage_price_updates?ei=AkRUXrqGAZKP8gLipYzoDQ&yv=3&async=mids:%2Fm%2F0ckhqlx,currencies:,_fmt:jspb";
    private static readonly REGEX = /(?<=("(TSLA)",))"(.*?)"/;
    private static readonly FREQUENCY = 10;

    private running: boolean;

    // Constructor
    constructor() {
        this.running = true;
        this.StartLooping()
            .then(() => {
                console.log("done");
            })
            .catch((err) => {
                console.log(err);
            });
    }

    // Methods

    private async StartLooping(): Promise<void> {
        try {
            // Also need a stopping mechanism
            while (this.running) {
                const result = await this.GetPrice();
                console.log(result);
                await this.Delay(StockFetcher.FREQUENCY);
            }
            Promise.resolve();
        } catch (e) {
            console.log("An error occurred, error: " + e);
            // Don't necessarily need to reject here, can handle the error and try to continue
            Promise.reject(e);
        }
    }

    private async GetPrice(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const url = StockFetcher.URL;
            https.get(url, (res: IncomingMessage) => {
                res.on('data', (data) => {
                    const regMatch = data.toString().match(StockFetcher.REGEX);
                    if (regMatch && regMatch.length > 0) {
                        const result = parseFloat(regMatch[0].replace("\"", ""));
                        resolve(result);
                    } else {
                        reject("Could not find a regex match");
                    }
                });

                res.on('error', (err) => {
                    reject(err);
                })
            });
        });
    }

    private async Delay(seconds: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }
}

const fetcher = new StockFetcher();
