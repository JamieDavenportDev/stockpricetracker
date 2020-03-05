import * as https from "https";
import * as fs from "fs";
import { IncomingMessage } from "http";
/*
    TODOS:
        1. [DONE] Fetch a price from API
        2. [DONE] Run regex to get the price from that API call
        3. [DONE] Store the resulting price in a local file
        4. [DONE] Adapt above to loop over list of stocks
        5. Make regex work for each stock by substituting stock name
        6. Make process interuptable
*/

interface Stock {
    name: string;
    url: string;
    regex: RegExp;
}

interface Price {
    name: string;
    price: string;
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
    private writeStream: fs.WriteStream;

    // Constructor
    constructor() {
        this.running = true;
        this.writeStream = fs.createWriteStream("./stock-prices.txt");

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
                const fetches: Promise<Price>[] = new Array<Promise<Price>>();
                StockFetcher.STOCKS.forEach((stock) => {
                    fetches.push(this.GetPrice(stock));
                });
                const timeStarted: Date = new Date();
                Promise.all(fetches)
                    .then((result: Price[]) => {
                        this.WriteStocksToFile(result, timeStarted);
                        resolve();
                    })
                    .catch((err) => {
                        console.error("Something went wrong, error: " + err);
                        reject(err);
                    });
            } catch (e) {
                console.log("Something went wrong in looping, error: " + e);
                reject(e);
            }
        });
    }

    private async GetPrice(stock: Stock): Promise<Price> {
        return new Promise<Price>((resolve, reject) => {
            https.get(stock.url, (res: IncomingMessage) => {
                res.on('data', (data) => {
                    const regMatch = data.toString().match(stock.regex);
                    if (regMatch && regMatch.length > 0) {
                        const result = parseFloat(regMatch[0].replace("\"", "")).toFixed(2);
                        resolve({name: stock.name, price: result});
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

    private async WriteStocksToFile(stocks: Price[], time: Date): Promise<void> {
        console.log(`${time.toISOString()} :`);
        console.table(stocks);

        const lineToWrite: string = 
            time.toISOString() +
            JSON.stringify(stocks) +
            "\n";

        this.writeStream.write(lineToWrite, (err) => {
            if (err) {
                console.error("Failed to write to file, error: " + err);
                Promise.reject(err);
            } else {
                Promise.resolve();
            }
        });
    }

    private async Delay(seconds: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }
}

const fetcher = new StockFetcher();
