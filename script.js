let myChart = null;
let retirementCosts = {};
let expenses = {};

async function fetchDataAndUpdate(callback) {
    // Clear specific item from localStorage
    localStorage.removeItem('countryData');

    // First, update the retirement costs
    await updateRetirementCosts();

    // Then, try to fetch data from localStorage
    const localData = localStorage.getItem('countryData');
    if (localData) {
        const parsedData = JSON.parse(localData);
        retirementCosts = parsedData.retirementCosts;
        expenses = parsedData.expenses;
        document.getElementById("calculateButton").disabled = false;
    } else {
        // If not in localStorage, fetch from countryData.json
        fetch('countryData.json')
            .then(response => response.json())
            .then(data => {
                retirementCosts = data.retirementCosts;
                expenses = data.expenses;
                console.log("Retirement Costs:", retirementCosts); // Troubleshooting log

                // Enable the calculate button after fetching the data
                document.getElementById("calculateButton").disabled = false;
            })
            .catch(error => {
                console.error('Error fetching the data:', error);
            });
    }

    // After updating the retirement costs, save them to localStorage
    saveUpdatedData({ retirementCosts, expenses });

    // Call the callback if provided and if it's a function
    if (typeof callback === "function") {
        callback();
    }
}


// Call the function on window load
window.onload = fetchDataAndUpdate;

function calculateYears() {
    const country = document.getElementById("country").value;
    const fund = parseFloat(document.getElementById("retirementFund").value);
    const usaCost = retirementCosts["USA"];
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
                console.log("GNI per Capita for", country, ":", gniPerCapita); // Troubleshooting log

                const usaCost = retirementCosts["USA"] || 0; // Default to 0 if undefined
                console.log("USA Retirement Cost:", usaCost); // Troubleshooting log

                const totalYearsInSelectedCountry = fund / gniPerCapita;

                const totalYearsInUSA = fund / usaCost;
                const yearsInUSA = Math.floor(totalYearsInUSA);
                const monthsInUSA = Math.round((totalYearsInUSA - yearsInUSA) * 12);
                
                const yearsInSelectedCountry = Math.floor(totalYearsInSelectedCountry);
                const monthsInSelectedCountry = Math.round((totalYearsInSelectedCountry - yearsInSelectedCountry) * 12);

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

async function updateRetirementCosts() {
    const previousYear = new Date().getFullYear() - 1;
    const countries = Object.keys(expenses); // Assuming all countries in expenses should have retirement costs

    // Use Promise.all to wait for all API calls to complete
    await Promise.all(countries.map(country => {
        return getCountryCode(country).then(countryCode => {
            if (!countryCode) {
                console.error(`Error retrieving country code for ${country}`);
                return;
            }

            const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?date=${previousYear}&format=json`;
                        return fetch(apiUrl)
                .then(response => response.json())
                .then(apiData => {
                    const gniPerCapita = apiData[1][0].value;
                    // Update the retirementCosts for the country
                    retirementCosts[country] = gniPerCapita;
                })
                .catch(error => {
                    console.error(`Error fetching data for ${country}:`, error);
                });
        });
    }));

    // After updating the retirement costs, save them to localStorage
    saveUpdatedData({ retirementCosts, expenses });
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

