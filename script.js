let myChart = null;
let retirementCosts = {};
let expenses = {};
let exchangeRates = {};
let currentLanguage = 'en';

async function fetchDataAndUpdate(callback) {
    const localData = localStorage.getItem('countryData');
    if (localData) {
        const parsedData = JSON.parse(localData);
        retirementCosts = parsedData.retirementCosts;
        expenses = parsedData.expenses;
        exchangeRates = parsedData.rate;
    } else {
        try {
            const response = await fetch('countryData.json');
            const data = await response.json();
            retirementCosts = data.retirementCosts;
            expenses = data.expenses;
            exchangeRates = data.rate;

            await updateRetirementCosts();

            saveUpdatedData({ retirementCosts, expenses, rate: exchangeRates });
        } catch (error) {
            console.error('Error fetching the data:', error);
        }
    }

    document.getElementById("calculateButton").disabled = false;

    if (typeof callback === "function") {
        callback();
    }
}

window.onload = function() {
    fetchDataAndUpdate();
    setupLanguageToggle();
    document.getElementById("currentCountry").addEventListener("change", function() {
        const selectedCountry = this.value;
        updateRetirementFundLabel(selectedCountry);
    });
};

function calculateYears() {
    const fundElement = document.getElementById("retirementFund");
    let fund = parseFloat(fundElement.value);

    const currentCountry = document.getElementById("currentCountry").value;
    if (currentCountry === "Canada") {
        if (!exchangeRates || !exchangeRates.USDtoCAD) {
            console.error("Exchange rates not loaded yet or USDtoCAD rate missing.");
            return;
        }
        const rate = exchangeRates.USDtoCAD;
        if (rate) {
            fund = fund / rate;
        }
        localStorage.setItem('convertedFundUSD', fund);
    } else {
        localStorage.setItem('originalFundUSD', fund);
    }

    console.log("USA data when calculating:", retirementCosts["USA"]);
    const country = document.getElementById("country").value;
    const currentCountryCost = retirementCosts[currentCountry];
    const usaCost = retirementCosts["USA"] || 0;

    if (!usaCost || usaCost === 0) {
        document.getElementById("result").innerText = "Error: Retirement cost data for the USA is missing or zero.";
        return;
    }
    if (isNaN(fund)) {
        document.getElementById("result").innerText = "Please enter a valid retirement fund amount.";
        return;
    }

    getCountryCode(country).then(countryCode => {
        if (!countryCode) {
            document.getElementById("result").innerText = "Error retrieving country code for selected country.";
            return;
        }

        const previousYear = new Date().getFullYear() - 1;
        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?date=${previousYear}&format=json`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                const gniPerCapita = apiData[1][0].value;
                console.log("GNI per Capita for", country, ":", gniPerCapita);

                const totalYearsInSelectedCountry = fund / gniPerCapita;
                const yearsInSelectedCountry = Math.floor(totalYearsInSelectedCountry);
                const monthsInSelectedCountry = Math.round((totalYearsInSelectedCountry - yearsInSelectedCountry) * 12);

                const totalYearsInCurrentCountry = fund / currentCountryCost;
                const yearsInCurrentCountry = Math.floor(totalYearsInCurrentCountry);
                const monthsInCurrentCountry = Math.round((totalYearsInCurrentCountry - yearsInCurrentCountry) * 12);

                if (yearsInSelectedCountry > 100) {
                    document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br>You clearly would not have to worry in ${country} as your funds would last more than 100 years assuming you adjust your spending to match the middle-class lifestyle of that country (about ${yearsInSelectedCountry} years in fact!).  <br><br><b>Now, consider the price range for these common expenses in ${country}:</b>`;
                } else {
                    document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br>Assuming you adjust your spending to match the middle lifestyle of that country, your retirement funds could last approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months in ${country}, compared to only about ${yearsInCurrentCountry} years and ${monthsInCurrentCountry} months in ${currentCountry}.<br><br><b>Now,
