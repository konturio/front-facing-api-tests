import { test, expect } from "@playwright/test";
import { apis } from "./helper";

type Layer = {
  id: string;
};

const languagesToTestLayers = ["es", "en", "ar", "de", "uk", "id", "ko"];
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

languagesToTestLayers.forEach((language) => {
  test(`Check ${atlasLayersUrl} to give correct language response (${language}) and style ninja json content to match ${language} locale`, async ({
    request,
  }) => {
    expect(atlasLayersUrl).toBeDefined();
    const response = await request.get(atlasLayersUrl!, {
      headers: {
        "User-Language": language,
      },
      timeout: 15000,
    });
    const headers = response.headers();

    // TO DO: Modify this header content once localization cache is added
    expect(
      headers,
      `${atlasLayersUrl} response had the next headers: ${JSON.stringify(headers, null, 2)}`
    ).toHaveProperty("vary", "Accept-Encoding");

    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    const firstObject = responseObj[0];
    expect(firstObject).toBeDefined();
    expect(firstObject.id.length).toBeGreaterThan(0);
    const linesUrl = firstObject.source.urls[0];

    // Check that atlasLayersUrl gave correct translation
    expect(linesUrl).toContain(`style_ninja_${language}.json`);

    const responseLines = await request.get(linesUrl!);
    expect(responseLines.status()).toEqual(200);
    const responseLinesObj = await responseLines.json();

    // Parsing response to get language used
    const layerLayout = responseLinesObj.layers.find(
      (layer: Layer) => layer.id === "label91"
    ).layout;
    const textFieldNameLanguage = layerLayout["text-field"]
      .flat()[2]
      .split(":")[1];
    expect(
      textFieldNameLanguage,
      `Text field has wrong language in style_ninja_${language}.json`
    ).toEqual(language);
  });
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
