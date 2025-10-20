/**
 * @fileoverview Data Access Object (DAO) for managing cryptocurrency holdings in localStorage.
 * This module provides functions to add, remove, and calculate total value of virtual currencies.
 * @author [Your Name]
 * @version 1.0
 */

const dao = {}
/**
 * Adds a specified amount of coins to a currency in localStorage.
 * @param {string} symbol - The currency symbol (e.g., 'BTC', 'ETH').
 * @param {number} amount - The amount of coins to add (must be positive).
 * @returns {boolean} True if the operation succeeded, false if validation failed.
 * @example
 * dao.add('BTC', 10); // Adds 10 BTC to holdings
 */

dao.add = function(symbol,amount) {
    console.log("add was called");
    const key = String(symbol || "").trim().toUpperCase();
    let current = Number(localStorage.getItem(key)) || 0;
    if (!Number.isFinite(amount) || amount <= 0){
        return false;
    } else {
        const buy = Number(amount)
        const newAmount = current + buy
        localStorage.setItem(key, newAmount);
        return true;
    }
};
/**
 * Removes a specified amount of coins from a currency in localStorage.
 * Validates that the user has sufficient balance before removing.
 * @param {string} symbol - The currency symbol (e.g., 'BTC', 'ETH').
 * @param {number} amount - The amount of coins to remove (must not exceed current balance).
 * @returns {boolean} True if the operation succeeded, false if validation failed or insufficient balance.
 * @example
 * dao.remove('ETH', 5); // Removes 5 ETH from holdings
 */
dao.remove = function(symbol,amount) {
    console.log("remove was called");
    const key = String(symbol || "").trim().toUpperCase();
    let current = Number(localStorage.getItem(key)) || 0 ;
    if (!Number.isFinite(amount) || amount <= 0 || amount > current) {
        return false;
    } else {
        const sell = Number(amount)
        const newAmount = current - sell
        localStorage.setItem(key, newAmount);
        return true;
    }
}
/**
 * Calculates the total value of all held coins in a specified currency.
 * Fetches current exchange rates and converts all holdings to the target currency.
 * @async
 * @param {string} currency - The target currency for conversion (e.g., 'USD', 'EUR').
 * @returns {Promise<number>} The total value of all holdings in the specified currency.
 * @throws {Error} If unable to fetch exchange rates for any cryptocurrency.
 * @example
 * const total = await dao.total('USD'); // Returns total value in USD
 */
    dao.total = async function total(currency){
        const targetCoin  = currency.trim().toUpperCase()
        if (typeof allCrypto === "undefined" ||allCrypto.length===0) {
            await service.getRates();
        }
        const valid = []
        for (let i = 0; i<allCrypto.length; i++){
            valid.push(allCrypto[i].symbol.toUpperCase());
        }

        // Iterate through all localStorage keys to find valid cryptocurrencies

    let usdTotal = 0;
        for (const key of Object.keys(localStorage)) {
            const all = key.toUpperCase();
            if (!valid.includes(all)) continue;
            const amount = Number(localStorage.getItem(key)) || 0;
            if (amount <= 0) continue;
            try {
                const rate = await service.getRate(all, "USD");
                if (Number.isFinite(rate))
                    usdTotal += amount * rate;
            } catch (err) {
                console.error(`Error fetching rate for ${all}:`, err);
            }
        }
        if (targetCoin  === "USD") return usdTotal;
            return await service.convertFromUSD(usdTotal, targetCoin )
};