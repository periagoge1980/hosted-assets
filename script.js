
document.getElementById("calculateButton").addEventListener("click", function() {
    document.getElementById("calculate").addEventListener("click", calculateYears);
});

async function getCountryCode(countryName) {
    const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
    const data = await response.json();
    return data[0].cca2;
}

async function calculateYears() {
    const selectedCountry = document.getElementById("country").value;
    const fund = document.getElementById("funds").value;
    const currentCountry = document.getElementById("currentCountry").value;
    const currentCountryCost = document.getElementById("currentCountryCost").value;

    if (!selectedCountry || !fund || !currentCountry || !currentCountryCost) {
        document.getElementById("result").innerText = "Please fill in all fields.";
        return;
    }

    try {
        const countryCode = await getCountryCode(selectedCountry);
        if (!countryCode) {
            document.getElementById("result").innerText = "Error retrieving country code for selected country.";
            return;
        }

        const previousYear = new Date().getFullYear() - 1;
        const apiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GNP.PCAP.CD?date=${previousYear}&format=json`;

        const response = await fetch(apiUrl);
        const apiData = await response.json();

        if (!apiData || !apiData[1] || apiData[1].length === 0 || !apiData[1][0].value) {
            console.error('Invalid or empty data received from API');
            document.getElementById("result").innerText = 'Invalid or empty data received from API';
            return;
        }

        const gniPerCapita = apiData[1][0].value;
        processRetirementFunds(fund, gniPerCapita, selectedCountry, currentCountryCost, currentCountry);
    } catch (error) {
        console.error(`Error fetching data for ${selectedCountry}:`, error);
        document.getElementById("result").innerText = `Error fetching data for ${selectedCountry}: ${error.message}`;
    }
}

function processRetirementFunds(fund, gniPerCapita, selectedCountry, currentCountryCost, currentCountry) {
    console.log(`Calculating retirement funds for ${selectedCountry} with GNI per capita of ${gniPerCapita}`);
    document.getElementById("result").innerText = `Calculation complete for ${selectedCountry}.`;
}
