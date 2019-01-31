const fs = require("fs");
const csv = require("fast-csv");
const geodist = require("geodist");
const solver = require("node-tspsolver");

const pathToCsvFile = process.argv[2];
const stream = fs.createReadStream(pathToCsvFile);

const cities = [];
const citiesCoordinates = [];
const distanceMatrix = [];
let finalDistanceOptimal = 0;

// Create the distance matrix from the lat/longs
const createDistanceMatrix = async ([head, ...tail]) => {
  const distanceMatrixTemp = [];
  if (!head) return true;

  for (i = 0; i < citiesCoordinates.length; i++) {
    // Calculate distance in km
    const calcDistance = await geodist(head, citiesCoordinates[i], {
      exact: true,
      unit: "km"
    });

    distanceMatrixTemp.push(calcDistance);
  }

  distanceMatrix.push(distanceMatrixTemp);
  await createDistanceMatrix(tail);
};

const calculateOptimalDistance = async ([head, ...tail]) => {
  if (head === undefined) return true;

  if (tail[0]) {
    finalDistanceOptimal = finalDistanceOptimal + distanceMatrix[head][tail[0]];
  }

  await calculateOptimalDistance(tail);
};

csv
  .fromStream(stream, { headers: true })
  .on("data", data => {
    cities.push(data.City);
    citiesCoordinates.push({
      latitude: data.Latitude,
      longitude: data.Longitude
    });
  })
  .on("end", async () => {
    // create cost matrix
    await createDistanceMatrix(citiesCoordinates);

    // calculate best route: result is an array of indices specifying the optimal route.
    const result = await solver.solveTsp(distanceMatrix, true, {});

    await calculateOptimalDistance(result);

    console.log("List of cities: ");
    console.log("-------------");
    result.map(e => {
      console.log(cities[e]);
      return cities[e];
    });

    console.log("-------------");
    console.log(`Distance: ${finalDistanceOptimal} km`);
    console.log("-------------");
    console.log("done...💥 🚀");
  });
