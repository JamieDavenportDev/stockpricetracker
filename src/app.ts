import * as https from "https";
import { IncomingMessage } from "http";
/*
    TODOS:
        1. [DONE] Fetch a price from API
        2. [DONE] Run regex to get the price from that API call
        3. Store the resulting price in a local file
        4. [DONE] Adapt above to loop over list of stocks
        5. Make regex work for each stock by substituting stock name
        6. Make process interuptable
*/

interface Stock {
    name: string;
    url: string;
    regex: RegExp;
}

class StockFetcher {

    //Properties
    private static readonly STOCKS: Stock[] = [
        {
            name: "Tesla",
            url: "https://www.google.com/async/finance_wholepage_price_updates?ei=AkRUXrqGAZKP8gLipYzoDQ&yv=3&async=mids:%2Fm%2F0ckhqlx,currencies:,_fmt:jspb",
            regex: /(?<=("(TSLA)",))"(.*?)"/,
        },
        {
            name: "Uber",
            url: "https://www.google.com/async/finance_wholepage_price_updates?ei=aDphXrWLH5HagQaFmaHwBQ&yv=3&async=mids:%2Fg%2F11fl472g5t,currencies:,_fmt:jspb",
            regex: /(?<=("(UBER)",))"(.*?)"/,
        },
        {
            name: "Facebook",
            url: "https://www.google.com/async/finance_wholepage_price_updates?ei=2jphXrOMJPLuxgOY5I3ACg&yv=3&async=mids:%2Fm%2F0rz9htl,currencies:,_fmt:jspb",
            regex: /(?<=("(FB)",))"(.*?)"/,
        },
    ];
    private static readonly FREQUENCY = 3;

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
        // Also need a stopping mechanism
        while (this.running) {
            try {
                await this.GetPrices();
                await this.Delay(StockFetcher.FREQUENCY);
            } catch (e) {
                console.log("An error occurred, error: " + e);
            }
        }
        Promise.resolve();
    }

    private async GetPrices(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                StockFetcher.STOCKS.forEach((stock) => {
                    this.GetPrice(stock)
                        .then((result) => {
                            console.log(stock.name + ": " + result);
                        })
                        .catch((err) => {
                            console.log(`An error occurred while fetching stock for ${stock.name}. Error: ${err}`);
                        });
                });
                resolve();
            } catch (e) {
                console.log("Something went wrong in looping, error: " + e);
                reject(e);
            }
        });
    }

    private async GetPrice(stock: Stock): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            https.get(stock.url, (res: IncomingMessage) => {
                res.on('data', (data) => {
                    const regMatch = data.toString().match(stock.regex);
                    if (regMatch && regMatch.length > 0) {
                        // Need to set the floating point to 2 decimals always e.g. 732.00
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
