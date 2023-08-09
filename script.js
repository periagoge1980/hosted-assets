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
    
    document.getElementById("retirementFund").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            calculateYears();
        }
    });

    if (isNaN(fund)) {
        document.getElementById("result").innerText = "Please enter a valid retirement fund amount.";
        return;
    }

    if (!retirementCosts[country]) {
        document.getElementById("result").innerText = "Error retrieving retirement costs for selected country.";
        return;
    }

    const totalYearsInSelectedCountry = fund / retirementCosts[country];
    const totalYearsInUSA = fund / retirementCosts["USA"];

    const yearsInSelectedCountry = Math.floor(totalYearsInSelectedCountry);
    const monthsInSelectedCountry = Math.round((totalYearsInSelectedCountry - yearsInSelectedCountry) * 12);

    const yearsInUSA = Math.floor(totalYearsInUSA);
    const monthsInUSA = Math.round((totalYearsInUSA - yearsInUSA) * 12);

    document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br>Assuming a middle-class lifestyle, your retirement funds would last approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months in ${country}, compared to only about ${yearsInUSA} years and ${monthsInUSA} months in the USA.<br><br><b>Now, consider the price range for these common expenses in ${country}:</b>`;
    displayExpenses(country);
    displayBarGraph(country);
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
    const barGraphDiv = document.getElementById('barGraph');

    // Get the countries and their costs
    const countries = Object.keys(retirementCosts);
    const costs = countries.map(country => retirementCosts[country]);

    // Sort countries based on their costs in descending order
    const sortedIndices = costs.map((cost, index) => index).sort((a, b) => costs[b] - costs[a]);
    const sortedCountries = sortedIndices.map(index => countries[index]);
    const sortedCosts = sortedIndices.map(index => costs[index]);

    // Highlight the selected country
    const colors = sortedCountries.map(country => country === selectedCountry ? '#007BFF' : '#E0E0E0'); // Use a bright color for the selected country and a muted color for others

    const data = [{
        type: 'bar',
        x: sortedCountries,
        y: sortedCosts,
        marker: {
            color: colors
        }
    }];

    const layout = {
        title: 'Average Cost per Year',
        font: {
            family: 'Arial, sans-serif',
            size: 14,
            color: '#333'
        },
        paper_bgcolor: '#f9f9f9', // Matches the background color set in CSS
        plot_bgcolor: '#f9f9f9',
        xaxis: {
            title: 'Countries',
            tickangle: -45, // Angle the country names for better readability
            gridcolor: '#e1e1e1' // Light gray grid lines
        },
        yaxis: {
            title: 'Cost in USD',
            gridcolor: '#e1e1e1'
        },
        margin: {
            l: 60,
            r: 10,
            b: 100,
            t: 40,
            pad: 4
        }
    };

    Plotly.newPlot(barGraphDiv, data, layout);
}

// edit updated data dynamically

let data = {
    "retirementCosts": {
        // ... your countries and costs ...
    },
    "expenses": {
        // ... your expenses data ...
    }
};

function updateRetirementCosts() {
    const previousYear = new Date().getFullYear() - 1;
    const countries = Object.keys(data.retirementCosts);

    // Use Promise.all to wait for all API calls to complete
    Promise.all(countries.map(country => {
        const countryCode = getCountryCode(country); // You'll need a function to map country names to their codes
        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?date=${previousYear}&format=json`;

        return fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                const gniPerCapita = apiData[1][0].value;
                // Update the retirementCosts for the country
                data.retirementCosts[country] = gniPerCapita;
            })
            .catch(error => {
                console.error(`Error fetching data for ${country}:`, error);
            });
    })).then(() => {
        // All API calls are complete, and the data object is updated
        // You can now save the updated data to a file or database
        saveUpdatedData(data); // You'll need a function to handle saving the data
    });
}

// save data to JSON

const fs = require('fs');

function saveUpdatedData(updatedData) {
    const jsonData = JSON.stringify(updatedData, null, 2); // Convert the data to a formatted JSON string

    fs.writeFile('path_to_your_directory/countryData.json', jsonData, (err) => {
        if (err) {
            console.error('Error writing to countryData.json:', err);
        } else {
            console.log('countryData.json has been updated!');
        }
    });
}

function getCountryCode(country_name) {
    // Load the JSON data from the file
    fetch('countryCode.json')
    .then(response => response.json())
    .then(data => {
        // Search for the country name and return its code
        for (let country of data.countries) {
            if (country.countryName === country_name) {
                return country.countryCode;
            }
        }
        // Return null if the country name is not found
        return null;
    })
    .catch(error => console.error('Error fetching the data:', error));
}
