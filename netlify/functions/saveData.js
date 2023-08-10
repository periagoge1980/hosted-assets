const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);

    try {
        fs.writeFileSync(path.join(__dirname, '..', 'countryData.json'), JSON.stringify(data, null, 2));
        return { statusCode: 200, body: 'Data saved successfully!' };
    } catch (error) {
        return { statusCode: 500, body: 'Error writing to file.' };
    }
};
