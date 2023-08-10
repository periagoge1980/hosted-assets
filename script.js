// Importing my Supabase client
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// Initialize Supabase client


const supabaseUrl = 'https://jhxlfoyutmlrhwymsjxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeGxmb3l1dG1scmh3eW1zanh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTE2ODM1NTYsImV4cCI6MjAwNzI1OTU1Nn0.SEX7oqRX8Xov3AWuYS2Md5cED9qW6SGdQBewE2YUo58';
const supabase = createClient(supabaseUrl, supabaseKey);
//const SUPABASE_URL = 'https://jhxlfoyutmlrhwymsjxv.supabase.co';
//const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeGxmb3l1dG1scmh3eW1zanh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTE2ODM1NTYsImV4cCI6MjAwNzI1OTU1Nn0.SEX7oqRX8Xov3AWuYS2Md5cED9qW6SGdQBewE2YUo58';
// const SUPABASE_URL = '%%SUPABASE_URL%%';
// const SUPABASE_KEY = '%%SUPABASE_KEY%%';
//const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let myChart = null;
let retirementCosts = {};
let expenses = {};

async function fetchRetirementCosts() {
    const { data, error } = await supabase
        .from('retirementCosts')
        .select('*');
    if (error) {
        console.error("Error fetching data:", error);
        displayError("Failed to fetch retirement costs.");
    }
    return data;
}

// Call the function to fetch retirement costs during initialization
fetchRetirementCosts().then(data => {
    retirementCosts = data;
});


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

function displayError(message) {
    // Display the error message to the user
    const errorDiv = document.createElement("div");
    errorDiv.innerText = message;
    errorDiv.style.color = "red";
    document.body.appendChild(errorDiv);
}

function displayExpenses(country) {
    const expenseDiv = document.getElementById("expenses");
    expenseDiv.innerHTML = ""; // Clear previous expenses

    for (let item in expenses[country]) {
        const expenseItem = document.createElement("div");
        expenseItem.classList.add("expense-item"); // Add the class for styling

        // Create an image element
        const expenseImage = document.createElement("img");
        expenseImage.src = `${item.replace(/ /g, '').toLowerCase()}.jpg`;
        expenseImage.alt = item;

        // Create a paragraph element for the text
        const expenseText = document.createElement("p");
        expenseText.innerText = `${item}: ${expenses[country][item]}`;

        // Append the image and text to the expenseItem div
        expenseItem.appendChild(expenseImage);
        expenseItem.appendChild(expenseText);

        // Append the expenseItem to the main expenses div
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

async function updateRetirementCosts(data) {
    const { error } = await supabase
        .from('retirementCosts')
        .update(data);
    if (error) console.error("Error updating data:", error);
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


