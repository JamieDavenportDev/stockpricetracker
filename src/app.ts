import * as https from "https";
import { IncomingMessage } from "http";
/*
    TODOS:
        1. Fetch a price from API
        2. Run regex to get the price from that API call
        3. Store the resulting price in a local file
        4. Adapt above to loop over list of stocks
*/

// API Link:
// https://www.google.com/async/finance_wholepage_price_updates?ei=AkRUXrqGAZKP8gLipYzoDQ&yv=3&async=mids:%2Fm%2F0ckhqlx,currencies:,_fmt:jspb

class StockFetcher {

    //Properties
    private static readonly URL = "https://www.google.com/async/finance_wholepage_price_updates?ei=AkRUXrqGAZKP8gLipYzoDQ&yv=3&async=mids:%2Fm%2F0ckhqlx,currencies:,_fmt:jspb";
    private static readonly REGEX = /(?<=("(TSLA)",))"(.*?)"/;

    // Constructor
    constructor() {
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
            // Loop 10 times to fetch 10 prices
            for (let i = 0; i < 10; i++) {
                const result = await this.GetPrice();
                console.log(result);
                await this.Delay(20);
            }
            Promise.resolve();
        } catch (e) {
            console.log("An error occurred, error: " + e);
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
