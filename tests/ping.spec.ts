import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

type Api = {
  env: string;
  name: string;
  url: string;
};

function getApis() {
  const data = fs.readFileSync(path.join(__dirname, "./apis.json")).toString();

  const environment = process.env.ENVIRONMENT ?? "prod";
  const apis: Api[] = JSON.parse(data).filter(
    (api: Api) => api.env === environment
  );

  return apis;
}

// Playwright has no timeout function for responses

function rejectIfTimeout(sec: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(function () {
      reject(new Error(`Response is taking longer than ${sec} seconds 🫠`));
    }, sec * 1000);
  });
}

const apis = getApis();
const apiNames = ["atlas main", "atlas config", "basemap"];

const [mainConfigUrl, staticConfigUrl, basemapStylesUrl] = apiNames.map(
  (name) => apis.find((api) => api.name === name)?.url
);

test(`Check ${mainConfigUrl} availability`, async ({ request }) => {
  expect(mainConfigUrl).toBeDefined();
  const response = await Promise.race([
    request.get(mainConfigUrl!),
    rejectIfTimeout(10),
  ]);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.id).toEqual("9043acf9-2cf3-48ac-9656-a5d7c4b7593d");
  expect(responseObj.name).toEqual("Kontur Atlas");
  expect(responseObj.description).toEqual("Kontur SAAS application");
  expect(responseObj.features[0]).toBeDefined();
});

test(`Check ${staticConfigUrl} availability`, async ({ request }) => {
  expect(staticConfigUrl).toBeDefined();
  const response = await Promise.race([
    request.get(staticConfigUrl!),
    rejectIfTimeout(10),
  ]);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.API_GATEWAY).toEqual("/active/api");
  expect(responseObj.OSM_EDITORS[0]).toBeDefined();
  expect(responseObj.FEATURES_BY_DEFAULT[0]).toBeDefined();
});

test(`Check ${basemapStylesUrl} availability`, async ({ request }) => {
  expect(basemapStylesUrl).toBeDefined();
  const response = await Promise.race([
    request.get(basemapStylesUrl!),
    rejectIfTimeout(10),
  ]);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.layers[0]).toBeDefined();
});
