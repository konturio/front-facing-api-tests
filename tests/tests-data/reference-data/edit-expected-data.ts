// ⚠️ Helper function for manual JSON editing in case of test data update.
// Used manually. Not part of production logic.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type DataKind = "functions" | "osm" | "population" | "thermalSpots";

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

export function updateExpectedRange({
  admin,
  id,
  result,
  typeOfData,
}: {
  admin: string;
  id: string;
  result: number;
  typeOfData: "functions" | "osm" | "population" | "thermalSpots";
}) {
  let fileName = "";
  switch (typeOfData) {
    case "functions":
      fileName = "functions-analytics-data.json";
      break;
    case "osm":
      fileName = "osm-analytics-data.json";
      break;
    case "population":
      fileName = "population-analytics-data.json";
      break;
    case "thermalSpots":
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

  const func = country[`${typeOfData}Data`].find(
    (f: ExpectedFunction) => f.id === id
  );
  if (!func) throw new Error(`Function "${id}" not found in admin "${admin}"`);
  let newMin = 0;
  let newMax = 0;
  switch (id) {
    case "populatedareakm2":
      if (result <= 999) {
        newMin = Math.floor(result);
        newMax = 2000;
      }
      if (result >= 1000 && result <= 9999) {
        newMin = Math.floor(result - 300);
        newMax = Math.ceil(result + 3000);
      }
      if (result >= 10000) {
        newMin = Math.floor(result - 1000);
        newMax = Math.ceil(result + 10000);
      }
      break;
    case "population":
      if (result <= 9999) {
        newMin = result >= 800 ? Math.floor(result) - 200 : 800;
        newMax = Math.ceil(result + 1000);
      }
      if (result >= 10000 && result < 100000) {
        newMin = Math.floor(result - 1000);
        newMax = Math.ceil(result + 7000);
      }
      if (result >= 100000 && result < 1000000) {
        newMin = Math.floor(result - 10000);
        newMax = Math.ceil(result + 100000);
      }
      if (result >= 1000000 && result < 10000000) {
        newMin = Math.floor(result - 300000);
        newMax = Math.ceil(result + 500000);
      }
      if (result >= 10000000 && result < 100000000) {
        newMin = Math.floor(result - 500000);
        newMax = Math.ceil(result + 1000000);
      }
      if (result >= 100000000) {
        newMin = Math.floor(result - 1000000);
        newMax = Math.ceil(result + 2000000);
      }
      break;
    case "gdp":
      newMin = result >= 2000000 ? Math.floor(result - 1000000) : 1000000;
      newMax = Math.ceil(result + 2000000000);
      break;
    case "urban":
      if (result <= 9999) {
        newMin = result >= 800 ? Math.floor(result) - 200 : 800;
        newMax = Math.ceil(result + 1000);
      }
      if (result >= 10000 && result < 100000) {
        newMin = Math.floor(result - 1000);
        newMax = Math.ceil(result + 7000);
      }
      if (result >= 100000 && result < 1000000) {
        newMin = Math.floor(result - 10000);
        newMax = Math.ceil(result + 100000);
      }
      if (result >= 1000000 && result < 10000000) {
        newMin = Math.floor(result - 300000);
        newMax = Math.ceil(result + 500000);
      }
      if (result >= 10000000 && result < 100000000) {
        newMin = Math.floor(result - 500000);
        newMax = Math.ceil(result + 1000000);
      }
      if (result >= 100000000) {
        newMin = Math.floor(result - 1000000);
        newMax = Math.ceil(result + 2000000);
      }
      break;
    case "industrialareakm2":
      newMin = Math.floor(result);
      newMax = Math.ceil(result + 300);
      break;
    case "industrialAreaKm2":
      newMin = Math.floor(result);
      newMax = Math.ceil(result + 300);
      break;
    case "forestareakm2":
      newMin = Math.floor(result);
      newMax = Math.ceil(result + 100);
      break;
    case "forestAreaKm2":
      newMin = Math.floor(result);
      newMax = Math.ceil(result + 100);
      break;
    case "volcanoescount":
      newMin = result;
      newMax = result + 10;
      break;
    case "volcanoesCount":
      newMin = result;
      newMax = result + 10;
      break;
    case "hotspotdaysperyearmax":
      newMin = 0;
      newMax = result <= 350 ? result + 15 : result;
      break;
    case "hotspotDaysPerYearMax":
      newMin = 0;
      newMax = result <= 350 ? result + 15 : result;
      break;
    case "osmgapspercentage":
      newMin = 0;
      newMax = result <= 99 ? Math.ceil(result) : 99;
      break;
    case "osmgapssum":
      newMin = 0;
      newMax = Math.ceil(result);
      break;
    default:
      break;
  }

  func.minExpectedResult = newMin;
  func.maxExpectedResult = newMax;

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log(`✅ Updated ${admin} → ${id}: [${newMin}, ${newMax}]`);
}
