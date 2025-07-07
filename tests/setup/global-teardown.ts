import { getJSON, countriesForWorkflow } from "../helpers/main-helper";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function globalTeardown() {
  if (process.env.IS_TESTING_BUSINESS_COUNTRIES_IN_A_ROW_AT_INSIGHTS_API) {
    const businessCountries = getJSON({
      fileFolder: "lookup-data",
      fileName: "business-countries",
    }) as string[];
    const lastCountry = countriesForWorkflow.at(-1) as string;
    const index = businessCountries.indexOf(lastCountry);

    let newCountries = [] as string[];
    if (index + 6 < businessCountries.length) {
      newCountries = businessCountries.slice(index + 1, index + 6);
    } else {
      const endPart = businessCountries.slice(index);
      const startPart = businessCountries.slice(0, 6 - endPart.length);
      newCountries = [...endPart, ...startPart];
    }
    try {
      fs.writeFileSync(
        path.join(
          __dirname,
          `./tests-data/lookup-data/countries-for-workflow.json`
        ),
        JSON.stringify(newCountries)
      );
    } catch (error) {
      throw new Error(error);
    }
  } else {
    console.log("Skipping globalTeardown");
  }
}

export default globalTeardown;
