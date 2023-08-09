let myChart = null;
let retirementCosts = {};
let expenses = {};

fetch('countryData.json')
    .then(response => response.json())
    .then(data => {
        retirementCosts = data.retirementCosts;
        expenses = data.expenses;
    })
    .catch(error => console.error('Error fetching the data:', error));

function calculateYears() {
    const country = document.getElementById("country").value;
    const fund = parseFloat(document.getElementById("retirementFund").value);

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
                const totalYearsInSelectedCountry = fund / gniPerCapita;
                const totalYearsInUSA = fund / retirementCosts["USA"];

                const yearsInSelectedCountry = Math.floor(totalYearsInSelectedCountry);
                const monthsInSelectedCountry = Math.round((totalYearsInSelectedCountry - yearsInSelectedCountry) * 12);

                const yearsInUSA = Math.floor(totalYearsInUSA);
                const monthsInUSA = Math.round((totalYearsInUSA - yearsInUSA) * 12);

                document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br>Assuming a middle-class lifestyle, your retirement funds would last approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months in ${country}, compared to only about ${yearsInUSA} years and ${monthsInUSA} months in the USA.<br><br><b>Now, consider the price range for these common expenses in ${country}:</b>`;
                displayExpenses(country);
                displayBarGraph(country);
            })
            .catch(error => {
                console.error(`Error fetching data for ${country}:`, error);
            });
    });
}

function displayExpenses(country) {
    const expenseDiv = document.getElementById("expenses");
    expenseDiv.innerHTML = ""; // Clear previous expenses

    for (let item in expenses[country]) {
        const expenseItem = document.createElement("div");
        expenseItem.style.backgroundImage = `url(${item.replace(/ /g, '').toLowerCase()}.jpg)`;
        expenseItem.style.backgroundSize = 'cover';
        expenseItem.innerHTML = `<p>${item}: ${expenses[country][item]}</p>`;
        expenseDiv.appendChild(expenseItem);
    }
}

function displayBarGraph(selectedCountry) {
    // ... (This part remains unchanged) ...
}

function updateRetirementCosts() {
    // ... (This part remains unchanged) ...
}

function saveUpdatedData(updatedData) {
    fetch('/.netlify/functions/saveData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
    })
    .catch(error => {
        console.error('Error saving the data:', error);
    });
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
