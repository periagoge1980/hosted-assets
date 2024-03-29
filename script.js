let myChart = null;
let retirementCosts = {};
let expenses = {};
let exchangeRates = {};

async function fetchDataAndUpdate(callback) {
    // First, try to fetch data from localStorage
    const localData = localStorage.getItem('countryData');
    if (localData) {
        const parsedData = JSON.parse(localData);
        retirementCosts = parsedData.retirementCosts;
        expenses = parsedData.expenses;
        exchangeRates = parsedData.rate;
    } else {
        try {
            // If not in localStorage, fetch from countryData.json
            const response = await fetch('countryData.json');
            const data = await response.json();
            retirementCosts = data.retirementCosts;
            expenses = data.expenses;
            exchangeRates = data.rate;


            // Then, update the retirement costs
            await updateRetirementCosts();

            // After updating the retirement costs, save them to localStorage
            saveUpdatedData({ retirementCosts, expenses, rate: exchangeRates });
        } catch (error) {
            console.error('Error fetching the data:', error);
            // Handle the error further if needed
        }
    }

    // Enable the calculate button ONLY after all operations are complete
    document.getElementById("calculateButton").disabled = false;

    // Call the callback if provided and if it's a function
    if (typeof callback === "function") {
        callback();
    }
}
// Call the function on window load
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
    // New snippet starts here
    const fundElement = document.getElementById("retirementFund");
    let fund = parseFloat(fundElement.value);

    const currentCountry = document.getElementById("currentCountry").value;
    if (currentCountry === "Canada") {
        const rate = exchangeRates.USDtoCAD;
 // Make sure countryData is accessible here
        if (rate) {
            fund = fund / rate;
        }
        localStorage.setItem('convertedFundUSD', fund);
    } else {
        localStorage.setItem('originalFundUSD', fund);
    }
    // New snippet ends here

    console.log("USA data when calculating:", retirementCosts["USA"]);
    const country = document.getElementById("country").value;
    const currentCountryCost = retirementCosts[currentCountry];
    // No need to re-declare, just use the rate variable directly
    const usaCost = retirementCosts["USA"] || 0; // Default to 0 if undefined
    console.log("USA Retirement Cost:", usaCost); // Troubleshooting log

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
        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?format=json&per_page=1&mrv=1`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                const gniPerCapita = apiData[1][0].value;
                console.log("GNI per Capita for", country, ":", gniPerCapita); // Troubleshooting log

                const totalYearsInSelectedCountry = fund / gniPerCapita;
                const yearsInSelectedCountry = Math.floor(totalYearsInSelectedCountry);
                const monthsInSelectedCountry = Math.round((totalYearsInSelectedCountry - yearsInSelectedCountry) * 12);

                const totalYearsInCurrentCountry = fund / currentCountryCost;
                const yearsInCurrentCountry = Math.floor(totalYearsInCurrentCountry);
                const monthsInCurrentCountry = Math.round((totalYearsInCurrentCountry - yearsInCurrentCountry) * 12);

                if (yearsInSelectedCountry > 100) {
                    document.getElementById("result").innerHTML = `You clearly would not have to worry in ${country} as your funds would last you more than a lifetime. Assuming you adjust your spending to match the middle-class lifestyle of that country, they would last you (approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months). Your retirement funds would also last you much longer there compared to in ${currentCountry}, where they would last approximately ${yearsInCurrentCountry} years and ${monthsInCurrentCountry} months.`;
                } else {
                    document.getElementById("result").innerHTML = `<b>Great choice! ${country} is a great retirement destination.</b> <br><br>Assuming you adjust your spending to match the middle-class lifestyle of that country, your retirement funds would last approximately ${yearsInSelectedCountry} years and ${monthsInSelectedCountry} months in ${country}, compared to only about ${yearsInCurrentCountry} years and ${monthsInCurrentCountry} months in ${currentCountry}.<br><br><b>Now, consider the price range for these common expenses in ${country}:</b>`;
                }

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

        // Create an image element for the expense
        const expenseImage = document.createElement("img");
        expenseImage.src = `${item.replace(/ /g, '').toLowerCase()}.jpg`;
        expenseImage.alt = item;
        expenseImage.style.width = "100%"; // Set the width to 100% of the parent div
        expenseImage.style.borderRadius = "5px"; // Add some border-radius to match the parent div

        // Append the image to the expenseItem div
        expenseItem.appendChild(expenseImage);

        // Create and append the text
        const expenseText = document.createElement("p");
        expenseText.innerText = `${item}: ${expenses[country][item]}`;
        expenseItem.appendChild(expenseText);

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

    Plotly.newPlot(barGraphDiv, data, layout).then(() => {
        // Set the background color once the graph is loaded
        barGraphDiv.style.backgroundColor = '#f9f9f9';
    });
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

        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode.toLowerCase()}/indicator/NY.GNP.PCAP.CD?date=${previousYear}&format=json`;
            return fetch(apiUrl)
                .then(response => response.json())
                .then(apiData => {
                    const gniPerCapita = apiData[1][0].value;
                    // Update the retirementCosts for the country
                    retirementCosts[country] = gniPerCapita;
                    if (country === "USA") {
                        console.log("USA GNI per Capita:", gniPerCapita);
                    }
                })
                .catch(error => {
                    console.error(`Error fetching data for ${country}:`, error);
                });
        });
    }))
    .then(() => {
        // After updating the retirement costs, save them to localStorage
        saveUpdatedData({ retirementCosts, expenses });
    });
}


function saveUpdatedData(updatedData) {
    try {
        localStorage.setItem('countryData', JSON.stringify(updatedData));
        console.log('Data saved to localStorage');
        console.log('USA data in saved data:', updatedData.retirementCosts["USA"]);
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
