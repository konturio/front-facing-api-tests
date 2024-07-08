import { test, expect } from "@playwright/test";
import { getApis } from "./helper";

const apis = getApis();
const apiNames = [
  "atlas main",
  "atlas config",
  "basemap",
  "atlas layers",
  "atlas global layers",
  "intercom 3-party",
  "atlas event feed",
];

const appIds: string[] = [];
const [
  mainConfigUrl,
  staticConfigUrl,
  basemapStylesUrl,
  atlasLayersUrl,
  atlasGlobalLayersUrl,
  intercomUrl,
  eventFeedUrl,
] = apiNames.map((name) => {
  const currentApi = apis.find((api) => api.name === name);
  if (currentApi?.appId) appIds.push(currentApi.appId);
  return currentApi?.url;
});
const [atlasAppId, intercomAppId] = appIds;

test(`Check ${mainConfigUrl} availability`, async ({ request }) => {
  expect(mainConfigUrl).toBeDefined();
  const response = await request.get(mainConfigUrl!);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.id).toEqual("9043acf9-2cf3-48ac-9656-a5d7c4b7593d");
  expect(responseObj.name).toEqual("Kontur Atlas");
  expect(responseObj.description).toEqual("Kontur SAAS application");
  expect(responseObj.features[0]).toBeDefined();
});

test(`Check ${staticConfigUrl} availability`, async ({ request }) => {
  expect(staticConfigUrl).toBeDefined();
  const response = await request.get(staticConfigUrl!);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.API_GATEWAY).toEqual("/active/api");
  expect(responseObj.OSM_EDITORS[0]).toBeDefined();
  expect(responseObj.FEATURES_BY_DEFAULT[0]).toBeDefined();
});

test(`Check ${basemapStylesUrl} availability`, async ({ request }) => {
  expect(basemapStylesUrl).toBeDefined();
  const response = await request.get(basemapStylesUrl!);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.layers[0]).toBeDefined();
});

test(`Check ${atlasLayersUrl} availability`, async ({ request }) => {
  expect(atlasLayersUrl).toBeDefined();
  const response = await request.get(atlasLayersUrl!);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj[0]).toBeDefined();
  expect(responseObj[0].id.length).toBeGreaterThan(0);
});

test(`Check ${atlasGlobalLayersUrl} availability`, async ({ request }) => {
  expect(atlasGlobalLayersUrl).toBeDefined();
  const response = await request.post(atlasGlobalLayersUrl!, {
    data: {
      appId: atlasAppId,
    },
  });
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj[0]).toBeDefined();
  expect(responseObj[0].id).toEqual("BIV__Kontur OpenStreetMap Quantity");
});

test(`Check ${intercomUrl} availability`, async ({ request }) => {
  expect(intercomUrl).toBeDefined();
  const response = await request.post(intercomUrl!, {
    data: {
      app_id: intercomAppId,
    },
    headers: {
      Accept: "application/json",
    },
  });
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.app.name).toEqual("Kontur");
});

test(`Check ${eventFeedUrl} availability`, async ({ request }) => {
  expect(eventFeedUrl).toBeDefined();
  const response = await request.get(eventFeedUrl!);
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj[0].feed).toEqual("kontur-public");
});
