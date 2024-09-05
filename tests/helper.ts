import fs from "fs";
import path from "path";

type Api = {
  env: string;
  name: string;
  url: string;
  appId?: string;
};

/**
 * Get the list of APIs from the apis.json file
 * @param apisNames The list of APIs names to get
 * @returns An array of API objects
 */

export function getApis(apisNames: string[]) {
  const data = fs
    .readFileSync(path.join(__dirname, "./testsData/apisToTest.json"))
    .toString();

  const environment = process.env.ENVIRONMENT ?? "prod";
  const apis: Api[] = JSON.parse(data).filter(
    (api: Api) => api.env === environment
  );
  const apisToTest = apisNames.map((name) =>
    apis.find((api) => api.name === name)
  );
  return apisToTest;
}

/**
 * Get the request body from a JSON file
 * @param fileName The name of the file containing the request body
 * @returns The request body as a JS object
 */

export function getRequestBody(fileName: string) {
  const data = fs
    .readFileSync(path.join(__dirname, `./testsData/${fileName}`))
    .toString();
  const request = JSON.parse(data);
  return request;
}
