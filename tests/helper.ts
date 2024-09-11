import fs from "fs";
import path from "path";

export type Api = {
  env: string;
  name: string;
  url: string;
  urlLargeImg?: string;
  appId?: string;
  expectedImgAddress?: string;
  expectedLargeImgAddress?: string;
  expectedNumImages?: number;
};

/**
 * Get the list of APIs from a json file
 * @param apisNames The list of APIs names to get
 * @returns An array of API objects
 */

export function getApis(apisNames: string[]) {
  try {
    const data = fs
      .readFileSync(path.join(__dirname, "./testsData/apisToTest.json"))
      .toString();

    const environment = process.env.ENVIRONMENT ?? "prod";
    const apis: Api[] = JSON.parse(data).reduce(
      (acc, api: Api) => {
        if (api.env === environment) {
          acc[api.name] = api;
        }
        return acc;
      },
      {} as Record<string, Api>
    );

    const apisToTest = apisNames.map((name) => apis[name]);
    return apisToTest;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Get the request body from a JSON file
 * @param fileName The name of the file containing the request body
 * @returns The request body as a JS object
 */

export function getRequestBody(fileName: string) {
  try {
    const data = fs
      .readFileSync(path.join(__dirname, `./testsData/${fileName}`))
      .toString();
    const requestBody = JSON.parse(data);
    return requestBody;
  } catch (error) {
    throw new Error(error);
  }
}
