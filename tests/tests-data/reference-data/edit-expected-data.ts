// ⚠️ Helper function for manual JSON editing in case of test data update.
// Used manually. Not part of production logic.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type DataKind =
  | "functionsData"
  | "osmData"
  | "populationData"
  | "thermalSpotsData";

type ExpectedFunction = {
  id: string;
  minExpectedResult: number;
  maxExpectedResult: number;
};

type AdminData<K extends DataKind> = {
  admin: string;
} & {
  [key in K]: ExpectedFunction[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This function updates the expected range for a specific data type and admin area. It is used to update the expected range for each data type in the tests.
 * @param object - object with admin area, type of value (id), result (actual  value from the server) and type of data (populationData, functionsData, osmData, thermalSpotsData)
 * returns void
 */

export default function updateExpectedRange({
  admin,
  id,
  result,
  typeOfData,
}: {
  admin: string;
  id: string;
  result: number;
  typeOfData: DataKind;
}) {
  let fileName = "";
  switch (typeOfData) {
    case "functionsData":
      fileName = "functions-analytics-data.json";
      break;
    case "osmData":
      fileName = "osm-analytics-data.json";
      break;
    case "populationData":
      fileName = "population-analytics-data.json";
      break;
    case "thermalSpotsData":
      fileName = "thermal-spots-analytics-data.json";
      break;
    default:
      throw new Error(`Unknown type of data: ${typeOfData}`);
  }
  const filePath = path.resolve(__dirname, fileName);
  const file = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(file) as AdminData<typeof typeOfData>[];

  const country = json.find((entry) => entry.admin === admin);
  if (!country) throw new Error(`Admin "${admin}" not found`);

  const func = country[typeOfData].find((f: ExpectedFunction) => f.id === id);
  if (!func) throw new Error(`Function "${id}" not found in admin "${admin}"`);
  let newMin = 0;
  let newMax = 0;
  switch (id) {
    case "populatedareakm2":
      // A country's populated area can't be zero or negative
      if (result <= 0) {
        newMin = 1;
        newMax = 500;
      } else if (result < 1000) {
        newMin = result >= 1 ? Math.floor(result) : 0.5;
        newMax = 2000;
      } else {
        newMin = Math.floor(result * 0.95);
        newMax = Math.ceil(result * 1.1);
      }
      break;

    case "population":
      // Countries have at least ~800 people; larger numbers get % bounds
      if (result < 10000) {
        newMin = result >= 100 ? Math.floor(result - 200) : 100;
        newMax = Math.ceil(result + 1000);
      } else if (result < 1000000) {
        newMin = Math.floor(result * 0.95);
        newMax = Math.ceil(result * 1.05);
      } else {
        newMin = Math.floor(result * 0.97);
        newMax = Math.ceil(result * 1.04);
      }
      break;

    case "gdp":
      // GDP should not be less than $100,000; use percentage for larger
      newMin = result > 1000000 ? Math.floor(result * 0.9) : 100000;
      newMax = Math.ceil(result * 1.2);
      break;

    case "urban":
      // Urban population has minimum and % for higher values
      if (result < 10000) {
        newMin = result > 200 ? Math.floor(result - 200) : 0;
        newMax = Math.ceil(result + 1000);
      } else {
        newMin = Math.floor(result * 0.95);
        newMax = Math.ceil(result * 1.05);
      }
      break;

    case "industrialareakm2":
    case "industrialAreaKm2":
      newMin = result > 5 ? Math.floor(result) : 0;
      newMax = Math.ceil(result * 1.25);
      break;

    case "forestareakm2":
    case "forestAreaKm2":
      newMin = result > 5 ? Math.floor(result) : 0;
      newMax = Math.ceil(result * 1.25);
      break;

    case "volcanoescount":
    case "volcanoesCount":
      newMin = result;
      newMax = result + 3;
      break;

    case "hotspotdaysperyearmax":
    case "hotspotDaysPerYearMax":
      newMin = 0;
      newMax = result <= 350 ? result + 15 : 365;
      break;

    case "osmgapspercentage":
      newMin = result > 30 ? Math.floor(result - 30) : 0;
      newMax = result <= 99 ? Math.ceil(result) : 99;
      break;

    case "osmgapssum":
      newMin = result > 10000 ? Math.floor(result * 0.8) : 0;
      newMax = Math.ceil(result);
      break;

    case "areaWithoutOsmBuildingsKm2":
      newMin = result > 1000 ? Math.floor(result * 0.8) : 0;
      newMax = Math.ceil(result + 10);
      break;

    case "areaWithoutOsmRoadsKm2":
      newMin = result > 1000 ? Math.floor(result * 0.8) : 0;
      newMax = Math.ceil(result + 10);
      break;

    case "osmBuildingGapsPercentage":
    case "osmRoadGapsPercentage":
      newMin = result > 20 ? Math.floor(result - 20) : 0;
      newMax =
        result <= 95
          ? Math.ceil(result)
          : result === 100
            ? 99
            : Math.ceil(result * 10) / 10;
      break;

    case "antiqueOsmBuildingsPercentage":
    case "antiqueOsmRoadsPercentage":
      newMin = result > 30 ? Math.floor(result - 30) : 0;
      newMax =
        result <= 99
          ? Math.ceil(result)
          : result === 100
            ? 99
            : Math.ceil(result * 100) / 100;
      break;

    case "osmBuildingsCount":
      newMin = result > 1 ? Math.floor(result) : 1;
      newMax = Math.ceil(result * 1.3);
      break;

    case "osmUsersCount":
      newMin = Math.floor(result * 0.5);
      newMax = Math.ceil(result * 5 + 10);
      break;

    case "osmUsersHours":
    case "localOsmUsersHours":
      newMin = result < 20 ? 0 : Math.floor(result * 0.5);
      newMax = Math.ceil(result * 5);
      break;

    case "aiBuildingsCountEstimation":
      newMin = result > 1 ? Math.floor(result) : 1;
      newMax = Math.ceil(result * 1.3);
      break;

    default:
      break;
  }

  func.minExpectedResult = newMin;
  func.maxExpectedResult = newMax;

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log(`✅ Updated ${admin} → ${id}: [${newMin}, ${newMax}]`);
}
