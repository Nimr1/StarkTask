// Example: generateInfluenceData.js (run this with Node.js)
// Make sure you have @influenceth/sdk installed in this project (npm install @influenceth/sdk)

import * as sdk from '@influenceth/sdk'; // Or however your SDK is imported
import fs from 'fs'; // To write to a file

function getBuildingData() {
    const buildings = [];
    // Assuming sdk.Building.TYPES is an object or array you can iterate
    // This is pseudo-code, adjust based on actual SDK structure
    Object.values(sdk.Building.TYPES).forEach(buildingType => {
        if (buildingType.i !== 0) { // Example filter from your earlier code
            buildings.push({
                id: String(buildingType.i), // Or another unique ID from the SDK building type
                name: buildingType.name
            });
        }
    });
    return buildings;
}

function getResourceData() {
    const resources = [];
    // Assuming sdk.Product.TYPES is where product/resource definitions are
    Object.values(sdk.Product.TYPES).forEach(productType => {
        // Add filters if needed (e.g., based on classification or category
        // to only include items you consider "resources" for the dropdown)
        // For example: if (productType.classification === 'Raw Material' || ...)
        resources.push({
            id: String(productType.i), // Or another unique ID
            name: productType.name
        });
    });
    // You might want to add resources from your `preferredSources` map if they aren't directly in TYPES
    // Or ensure your `Product.IDS` in the client script align with these.
    return resources.sort((a,b) => a.name.localeCompare(b.name));
}

const buildingData = getBuildingData();
const resourceData = getResourceData();

// Output as JavaScript code you can paste
console.log('// --- Generated Building Data ---');
console.log('const gameBuildings = ' + JSON.stringify(buildingData, null, 4) + ';');
console.log('\n// --- Generated Resource Data ---');
console.log('const gameResources = ' + JSON.stringify(resourceData, null, 4) + ';');

// Optionally, write to a file
// fs.writeFileSync('./generatedGameData.js',
// `const gameBuildings = ${JSON.stringify(buildingData, null, 4)};\n\nconst gameResources = ${JSON.stringify(resourceData, null, 4)};`
// );
// console.log("Generated data written to generatedGameData.js");