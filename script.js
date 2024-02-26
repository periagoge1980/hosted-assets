let myChart = null;
let retirementCosts = {};
let expenses = {};
let exchangeRates = {};

function fetchDataAndUpdate() {
  if (localStorage.getItem("exchangeRates")) {
    exchangeRates = JSON.parse(localStorage.getItem("exchangeRates"));
    document.getElementById("calculateButton").disabled = false; // Enable button here
  } else {
    fetch("countryData.json")
      .then(response => response.json())
      .then(data => {
        exchangeRates = data.rates;
        localStorage.setItem("exchangeRates", JSON.stringify(exchangeRates));
        document.getElementById("calculateButton").disabled = false; // Enable button here
      })
      .catch(error => console.error("Error loading exchange rates:", error));
  }
}
    document.getElementById("calculateButton").disabled = false;
    if (typeof callback === "function") {
        callback();
    }
}

window.onload = function() {
    fetchDataAndUpdate();
    document.getElementById("currentCountry").addEventListener("change", function() {
        const selectedCountry = this.value;
        const label = document.querySelector("label[for='retirementFund']");
        if (selectedCountry === "Canada") {
            label.innerText = "Enter your total expected retirement funds in CAD:";
        } else {
            label.innerText = "Enter your total expected retirement funds in USD:";
        }
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
        fund = fund / exchangeRates.USDtoCAD;
        localStorage.setItem('convertedFundUSD', fund.toString());
    } else {
        localStorage.setItem('originalFundUSD', fund.toString());
    }

    const country = document.getElementById("country").value;
    getCountryCode(country).then(countryCode => {
        if (!countryCode) {
            document.getElementById("result").innerText = "Error retrieving country code for selected country.";
            return;
        }
        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?format=json&per_page=1&mrv=1`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                if (apiData && apiData.length > 1 && apiData[1] && apiData[1].length > 0) {
                    const gniPerCapita = apiData[1][0].value;
                    // Further logic to use gniPerCapita
                } else {
                    console.error(`No GNI data available for ${country} or unexpected response structure.`);
                    document.getElementById("result").innerText = `No GNI data available for ${country}.`;
                }
            })
            .catch(error => {
                console.error(`Error fetching data for ${country}:`, error);
                document.getElementById("result").innerText = `Error fetching data for ${country}: ${error}`;
            });
    });
}

function displayExpenses(country) {
    // Function content remains unchanged
}

function displayBarGraph(selectedCountry) {
    // Function content remains unchanged
}

async function updateRetirementCosts() {
    // Function content remains unchanged, ensure to use mrv=1 for API calls
}

function saveUpdatedData(updatedData) {
    try {
        localStorage.setItem('countryData', JSON.stringify(updatedData));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

function getCountryCode(country_name) {
    return fetch('countryCode.json')
        .then(response => response.json())
        .then(data => {
            for (let country of data.countries) {
                if (country.countryName === country_name) {
                    return country.countryCode;
                }
            }
            return null;
        })
        .catch(error => {
            console.error('Error fetching the data:', error);
            return null;
        });
}
