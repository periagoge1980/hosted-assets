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

    document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br> Your retirement funds would last approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months in ${country}, compared to only about ${yearsInUSA} years and ${monthsInUSA} months in the USA.<br><br><b>Now, consider the price range for these common expenses in ${country}:</b>`;
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
    const ctx = document.getElementById('barGraph').getContext('2d');

    // Destroy the previous chart if it exists
    if (myChart) {
        myChart.destroy();
    }

    // Get the countries and their costs
    const countries = Object.keys(retirementCosts);
    const costs = countries.map(country => retirementCosts[country]);

    // Sort countries based on their costs in descending order
    const sortedIndices = costs.map((cost, index) => index).sort((a, b) => costs[b] - costs[a]);
    const sortedCountries = sortedIndices.map(index => countries[index]);
    const sortedCosts = sortedIndices.map(index => costs[index]);

    // Highlight the selected country
    const backgroundColors = sortedCountries.map(country => country === selectedCountry ? 'lightblue' : 'grey');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedCountries,
            datasets: [{
                label: 'Average Cost per Year',
                data: sortedCosts,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

