/**
 * @fileoverview Service layer for fetching cryptocurrency and fiat currency exchange rates.
 * Provides functions to retrieve rates from CoinGecko API and ExchangeRate-API.
 * Implements caching mechanism for fiat currencies to reduce API calls.
 * @author [Your Name]
 * @version 1.0
 */

/** @type {Array<Object>} Cache for all cryptocurrency data from CoinGecko */
let allCrypto = [];

/** @type {Object<string, number>} Map of crypto symbols to their USD prices */
let cryptoRate = {};
/**
 * Service object containing methods for cryptocurrency rate operations.
 * @namespace service
 */
const service= {
    /**
     * Fetches current market data for all cryptocurrencies from CoinGecko API.
     * Populates the allCrypto array and cryptoRate object with latest prices.
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If the API request fails.
     * @memberof service
     */
    async getRates() {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd")
        if(!response.ok){
            throw new Error("Failed to fetch crypto values")
        }
        const data = await response.json()
        console.log(" Fetched data from API:", data);
        allCrypto = data;
        console.log(" allCrypto loaded:", allCrypto.length);

        for (let i = 0; i<data.length; i++){
            cryptoRate[data[i].symbol.toUpperCase()]=data[i].current_price
        }
    },
    /**
     * Retrieves the current USD price for a specific cryptocurrency symbol.
     * Automatically calls getRates() if data hasn't been loaded yet.
     * @async
     * @param {string} symbol - The cryptocurrency symbol (e.g., 'btc', 'eth').
     * @param {string} currency - The target currency (currently only 'USD' is used).
     * @returns {Promise<number>} The current price in the specified currency.
     * @throws {Error} If the symbol is not found or price is invalid.
     * @memberof service
     */
        async getRate(symbol, currency) {
        if (allCrypto.length === 0) {
            await service.getRates();
            console.log(" Calling getRates because allCrypto is empty");
        }
        const symbolPrice = allCrypto.find(coin => coin.symbol === symbol.toLowerCase())
        if (!symbolPrice || typeof symbolPrice.current_price !== "number") {
            throw new Error(`Rate not found for ${symbol}/${currency}`);
        }
        return symbolPrice.current_price;

    },
    /**
     * Converts a USD amount to a target fiat currency.
     * @async
     * @param {number} usdamount - The amount in USD to convert.
     * @param {string} targetcurrency - The target currency code (e.g., 'EUR', 'ILS').
     * @returns {Promise<number>} The converted amount in target currency.
     * @memberof service
     */
        async convertFromUSD(usdAmount, targetcurrency) {
            const currency = targetcurrency.trim().toUpperCase();
            const amount = Number(usdAmount);
            if (currency === "USD") return amount;
                const rate = await service.getSingleCurrency(currency)
                return amount * rate;
        },
    /**
     * Retrieves the exchange rate for a single fiat currency relative to USD.
     * @async
     * @param {string} currency - The currency code to look up (e.g., 'EUR', 'GBP').
     * @returns {Promise<number|null>} The exchange rate, or null if currency not supported.
     * @memberof service
     */
        async getSingleCurrency(currency) {
            let cur = currency.trim().toUpperCase();
            if (cur === "USD") {
                return  1;
            }
            await refresh.ensureValues();

            if (cur in allCurrencies) {
                return allCurrencies[cur  ];
            } else {
                console.log("The currency " + cur   + " not supported");
                return null

            }
        }

}
const TTL_MS = 86400000;
let lastUpdate=null;
let allCurrencies = {};

/**
 * Checks if the cached fiat currency data is still valid.
 * Data is considered fresh if it was updated within the last 24 hours.
 * @returns {boolean} True if cache is fresh, false otherwise.
 */
function isFiatCacheFresh() {
    if (!lastUpdate) return false;
    if (Object.keys(allCurrencies).length===0) return false;
    return ((Date.now() - lastUpdate) <= TTL_MS);
}

/**
 * Object responsible for fetching fiat currency exchange rates.
 * @namespace value
 */
const value = {
    /**
     * Fetches latest fiat currency exchange rates from ExchangeRate-API.
     * Updates the allCurrencies object and lastUpdate timestamp.
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If the API request fails.
     * @memberof value
     */
    async currentValue () {
        const response = await fetch("https://v6.exchangerate-api.com/v6/89fe0ab9f73859cee5abebf4/latest/USD")
        if(!response.ok){
            throw new Error("Failed to fetch currency values");
        }
        const data = await response.json();
        console.log(" Fetched data from API:", data);
        allCurrencies = data.conversion_rates;
        console.log(" allCurrencies loaded:", Object.keys(allCurrencies).length);
        lastUpdate = Date.now();
    }
}
/**
 * Object containing cache refresh logic for fiat currencies.
 * @namespace refresh
 */
const refresh= {
    async ensureValues() {
        if (!isFiatCacheFresh()) {
            await value.currentValue();
        }
    }
};













