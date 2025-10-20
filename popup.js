/**
 * @fileoverview Main UI controller for the cryptocurrency wallet extension popup.
 * Handles user interactions, data display, and chart rendering.
 * @author [Your Name]
 * @version 1.0
 */

// DOM element references
/** @type {HTMLInputElement} Input field for cryptocurrency symbol */
const symbolinput = document.getElementById("symbolInput");
const cryptolist = document.getElementById("symbolList");
const currency = document.getElementById("Amount");
const total = document.getElementById("totalValue");
const result = document.getElementById("result");
//popup.html
const currencyinput=document.getElementById("currencyInput")
const currencylist = document.getElementById("currencyList")
const choose=document.getElementById("userChoice")//show the prefer coin to the user
const chooseBtn=document.getElementById("chooseBtn")//user choose a coin


/**
 * Updates the UI to display the user's currently selected preferred currency.
 * @param {string} currency - The currency code to display (e.g., 'USD', 'EUR').
 * @returns {void}
 */
function updatePreferredCurrency(currency){
    choose.textContent="Your favorite currency is " + currency
}


//בלי קוד תמשיך
chooseBtn.addEventListener("click", async()=>{
    await refresh.ensureValues()
    const currentCurrency=(localStorage.getItem("preferredCurrency")||"USD").trim().toUpperCase();
    const nextCurrency=(currencyinput.value||"").trim().toUpperCase();
    const newCurrency=nextCurrency || "USD"
    if (newCurrency === currentCurrency) {
        choose.textContent = "The currency didnt change";
        return;
    }else if (await service.getSingleCurrency(newCurrency)) {
        localStorage.setItem("preferredCurrency",newCurrency)
        updatePreferredCurrency(newCurrency)
        await refreshUI()
        console.log("Preferred currency updated to: " + newCurrency)
    }else{
        choose.textContent ="The currency " + newCurrency + " not supported"
        return;
    }
})

async function getPreferredCurrency(){
    const currencyName =(localStorage.getItem("preferredCurrency")||"USD").trim().toUpperCase();
    if (await service.getSingleCurrency(currencyName )){
        // console.log("The total value is updated to " + coinname + " value.")
        return currencyName ;
    }else{
        console.log("Preferred currency not supported, go to default USD")
        return "USD";
    }
}
/**
 * Converts a USD amount to the user's preferred currency.
 * @async
 * @param {number} usdAmount - The amount in USD to convert.
 * @returns {Promise<number>} The converted amount in preferred currency.
 */
async function toAmountCurrency(usdAmount){
    const preferred= await getPreferredCurrency()
    if (preferred==="USD"){
        return usdAmount
    }else{
        return await service.convertFromUSD(usdAmount,preferred)
    }
}

/**
 * Validates the user input for symbol and amount.
 * @param {string} symbol - The coin symbol entered by the user.
 * @param {number} amount - The amount entered by the user.
 * @returns {boolean} True if input is valid, false otherwise.
 */
function isValidInput(symbol, amount) {
    if (!symbol || symbol.trim() === "") {
        result.innerText = "Please enter a legal currency name.";
        return false;
    }
    if (amount < 0 || isNaN(amount)  ) {
        result.innerText = "Please enter a valid number.";
        return false;
    }
    return true;
}

/**
 * Verifies if a given cryptocurrency symbol is supported by the API.
 * @async
 * @param {string} symbol - The cryptocurrency symbol to check (case-insensitive).
 * @returns {Promise<boolean>} True if the currency is supported, false otherwise.
 */
async function checkCurrency(symbol) {
    if (allCrypto.length===0) {
        await service.getRates()
    }
    return allCrypto.some(item => item.symbol.toLowerCase() === symbol);
}
/**
 * Handles the click event for adding currency.
 * Validates input and calls dao.add with the entered symbol and amount.
 */
const addButton = document.getElementById("addBtn");
addButton.addEventListener("click", async function () {
    const symbol = symbolinput.value.toUpperCase();
    const amount = Number(currency.value);

    if (!isValidInput(symbol, amount)) return;

    const symbolLegal = await checkCurrency(symbol.toLowerCase());
    if (!symbolLegal) {
        result.innerText = "This crypto is not supported.";
        return;
    }

    const added = dao.add(symbol, amount);
    if (added === true){
        result.innerText = "Added currency successfully!";
        symbolinput.value = "";
        currency.value = "";
        await updateHoldingsTable();
        await drawHoldingsPie();
        result.innerText ="";
    }else{
        result.innerText = "This amount cannot be added. ";
    }
});

/**
 * Handles the click event for removing currency.
 * Validates input and calls dao.remove with the entered symbol and amount.
 */
const removeButton = document.getElementById("removeBtn");
removeButton.addEventListener("click", async function () {
    const symbol = symbolinput.value.toUpperCase();
    const amount = Number(currency.value);


    if (!isValidInput(symbol, amount)) return;

    const symbolLegal = await checkCurrency(symbol.toLowerCase());
    if (!symbolLegal) {
        result.innerText = "This crypto is not supported.";
        return;
    }

    const removed = dao.remove(symbol, amount);
    if (removed === true) {
        result.innerText = "Removed currency successfully!";
        symbolinput.value = "";
        currency.value = "";
        await updateHoldingsTable();
        await drawHoldingsPie();
        result.innerText ="";
    }else{
        result.innerText="This amount cannot be removed.";

    }
})

/**
 * Handles the click event for calculating total value.
 * Calls dao.total and displays the result to the user.
 */
const calcButton = document.getElementById("totalBtn");
calcButton.addEventListener("click", async function () {
    try {
        await refresh.ensureValues()
        const updated = await getPreferredCurrency()
        const amount = await dao.total(updated)
        if (!Number.isFinite(amount)){
            total.innerText = "Total unavailable. Try again.";
            return;
        }else{
            total.innerText = "The total value of currency: "  + amount.toFixed(2) + " "  + updated
            console.log("The total value of currency: "  + amount.toFixed(2) +  " "  + updated)
        }
    }catch(err){
        console.error(err);
        total.innerText = "Error calculating total.";
    }
});


/**
 * Normalizes a cryptocurrency symbol to uppercase format.
 * @param {string} sym - The symbol to normalize.
 * @returns {string} The normalized symbol in uppercase.
 */
function canonicalSymbol(sym) {
    if(!sym) return "";
    return sym.trim().toUpperCase()
}

/**
 * Collects all cryptocurrency holdings from localStorage.
 * Filters out non-positive amounts and invalid entries.
 * @returns {Map<string, number>} A map of symbols to their held amounts.
 */
function collectHoldings() {
    const holding = new Map();
    const ignore = ['preferredCurrency', 'grandTotalPreferred'];
    for (let key in localStorage) {
        if (ignore.includes(key)) continue;

        const symbol = key.trim().toUpperCase();
        const amount = Number(localStorage.getItem(key));
        if (Number.isFinite(amount) && amount > 0) {
            holding.set(symbol, amount);
        }
    }
    return holding;
}

// 🟢 גרסה מקצועית עם קיבוץ פרוסות זעירות ל-"Other (<1%)"
async function drawHoldingsPie() {
    // אם אינך קורא ל-refreshUI בטעינה, דאג לטעינת שערים כאן:
    if (typeof allCrypto === "undefined" || allCrypto.length === 0) {
        await service.getRates();
    }
    const preferred = await getPreferredCurrency()


    const valid = [];
    for (let i = 0; i < allCrypto.length; i++) {
        valid.push(allCrypto[i].symbol.toUpperCase());
    }
    const labels = [];
    const values = [];
    const colors = [];

// drawHoldingsPie – קטע מחליף (אחרי)
    const holdings = collectHoldings(); // Map { 'BTC'->10, 'USDT'->100, ... }
    for (const [symbol, amount] of holdings) {
        if (!valid.includes(symbol)) continue;

        const rate=cryptoRate[symbol]
        const usdValue = amount * rate
        const prefValue = await toAmountCurrency(usdValue)
        labels.push(symbol);
        values.push(prefValue);
        colors.push(colorForSymbol(symbol));
    }

    // אין נתונים? ננקה תרשים אם קיים ונצא
    if (values.length === 0) {
        if (window.myChart) window.myChart.destroy();
        return;
    }

    // sort from largest to smallest
    for (let i = 0; i < values.length - 1; i++) {
        for (let j = i + 1; j < values.length; j++) {
            if (values[j] > values[i]) {
                let temp = values[i];
                values[i] = values[j];
                values[j] = temp;

                temp = labels[i];
                labels[i] = labels[j];
                labels[j] = temp;

                temp = colors[i];
                colors[i] = colors[j];
                colors[j] = temp;
            }
        }
    }

    const L0 = labels;
    const D0 = values;
    const C0 = colors;

    // אחרי שחישבנו L, D, C, וגם otherNames:
    const compressed = compressSmallSlices(L0, D0, C0, 0.01);
    const L = compressed.labels;
    const D = compressed.data;
    const C = compressed.colors;
    const otherNames = compressed.otherNames;

    const ctx = document.getElementById("holdingsChart").getContext("2d");
    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: L,
            datasets: [{
                data: D,
                backgroundColor: C,
                borderColor: "#fff",
                borderWidth: 1,
                hoverOffset: 8
            }],
            otherNames: otherNames
        },
        options: {
            responsive: false,
            maintainAspectRatio: true, // שומר יחס
            aspectRatio: 1,

            plugins: {
                legend: {position: "bottom"},
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const val = ctx.parsed;
                            let sum = 0;
                            for (let i = 0; i < D.length; i++) {
                                sum += D[i];
                            }
                            let pct = "0.0";
                            if (sum > 0) {
                                pct = (val / sum * 100).toFixed(1);
                            }
                            const base = ctx.label + ": " + val.toFixed(2) + " " + preferred + " (" + pct + "%)";
                            if (ctx.label === "Other") {
                                const list = ctx.chart.config.data.otherNames || [];
                                if (list.length > 0) {
                                    return base + "\nIncludes: " + list.join(", ");
                                }
                                return base;
                            }
                            return base;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Compresses small pie chart slices into a single "Other" category.
 * Slices below the threshold percentage are grouped together.
 * @param {Array<string>} labels - Array of cryptocurrency symbols.
 * @param {Array<number>} data - Array of corresponding values.
 * @param {Array<string>} colors - Array of corresponding colors.
 * @param {number} [limitshold=0.01] - Threshold percentage (default 1%).
 * @returns {Object} Object containing compressed labels, data, colors, and otherNames array.
 */
function compressSmallSlices(labels, data, colors, limitshold = 0.01) {
    let total=0
    for (let i=0; i<data.length; i++){
        total += data[i]
    }

    if (total === 0) return {labels, data, colors,otherNames: []};
    const newLabels = [];
    const newData = [];
    const newColors = [];
    const otherNames = [];
    let othersAmount = 0;

    for (let i = 0; i < data.length; i++) {
        if (data[i] / total < limitshold) {
            othersAmount += data[i]
        otherNames.push(labels[i]);
        } else {
            newLabels.push(labels[i]);
            newData.push(data[i]);
            newColors.push(colors[i]);
        }
    }

    if (othersAmount > 0) {
        newLabels.push("Other");
        newData.push(othersAmount);
        newColors.push("#cccccc");
    }

    return {labels: newLabels, data: newData, colors: newColors, otherNames};
}

/**
 * Generates a consistent HSL color for a given cryptocurrency symbol.
 * Uses character code sum to ensure the same symbol always gets the same color.
 * @param {string} sym - The cryptocurrency symbol.
 * @returns {string} An HSL color string.
 */
function colorForSymbol(sym) {
    let total = 0;
    for (let i = 0; i < sym.length; i++) {
        total+= sym.charCodeAt(i);

    }
    const color = total % 360;
    return "hsl("+ color + ", 65%, 55%)";
}


symbolinput.addEventListener("input", function buildCryptoSelect() {
    const recordCrypto = (symbolinput.value || "").trim().toUpperCase();
    cryptolist.innerHTML = '';
    if (!recordCrypto) return;


    const nameSymbol = Array.from(new Set(allCrypto.map(crypto => (crypto.symbol || '').toUpperCase())))
        .filter(v => v.startsWith(recordCrypto))
        .slice(0, 50);

    nameSymbol.forEach(variable => {
        const newSymbol = document.createElement('option');
        newSymbol.value = variable;
        cryptolist.appendChild(newSymbol);
    });
})

currencyinput.addEventListener("input", function buildCurrencySelect() {
    const recordCurrency = (currencyinput.value || "").trim().toUpperCase();
    currencylist.innerHTML = '';
    if (!recordCurrency) return;

    const valuesCurrency = Array.from(new Set(Object.keys(allCurrencies).map(currency => currency.toUpperCase())))
        .filter(v => v.startsWith(recordCurrency))
        .slice(0, 50);

    valuesCurrency.forEach(variable => {
        const newCurrency = document.createElement("option");
        newCurrency.value = variable;
        currencylist.appendChild(newCurrency);
    });
})



/**
 * Updates the holdings table based on current data in localStorage.
 * Fetches the latest USD rates using service.getRate for each supported coin.
 * Populates the table with symbol, amount, rate, and total value.
 * Also stores the grand total value in localStorage as 'grandTotalUSD'.
 *
 * @async
 * @function updateHoldingsTable
 * @returns {Promise<void>}
 */
async function updateHoldingsTable() {
    if (allCrypto.length === 0) {
        await service.getRates();
    }

    const valid = [];
    for (let i = 0; i < allCrypto.length; i++) {
        valid.push(allCrypto[i].symbol.toUpperCase());

    }
    const body = document.querySelector("#holdingsTable tbody");
    if (!body) return;
    body.innerHTML = "";

    const holdings = collectHoldings(); // Map<symbol, amount>
    const preferred= await getPreferredCurrency()

    let grandTotal = 0;

    for (const [symbol, amount] of holdings) {
        if (!valid.includes(symbol)) continue;

        let rate = 0;
        try {
            rate = await service.getRate(symbol, "USD")
        }catch (err) {
            console.error(`Error fetching rate for ${symbol}:`, err);
            continue;
        }
        const prefValue= amount * rate
        const prefervalue = await toAmountCurrency(prefValue);
        grandTotal += prefervalue;

        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${symbol}</td>
                    <td>${amount}</td>
                    <td>${rate.toFixed(2)}</td>
                    <td>${prefervalue.toFixed(2)} ${preferred}</td>
    `;
        body.appendChild(row);
    }

    localStorage.setItem("grandTotalPreferred", grandTotal.toFixed(2));
}



/**
 * Refreshes the entire user interface by updating the table and chart.
 * Called on initial load and after data changes.
 * @async
 * @returns {Promise<void>}
 */
async function refreshUI() {
    if (typeof allCrypto === "undefined" || allCrypto.length === 0) {
        await service.getRates();
    }
    await updateHoldingsTable();
    await drawHoldingsPie();
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await refreshUI();
        await getPreferredCurrency()
        if (lastUpdate === null || (Object.keys(allCurrencies).length === 0)){
            await refresh.ensureValues()
            console.log("The currency list is update.")


        }
        const userCurrency =(localStorage.getItem("preferredCurrency")||"").trim().toUpperCase()
        updatePreferredCurrency(userCurrency ||"USD");
    } catch (e) {
        console.error(e);
    }

});

