import { test, expect } from "@playwright/test";
import { getApis } from "../helpers/main-helper";

const apiObjsToTest = getApis(
  [
    "atlas main",
    "atlas config",
    "basemap",
    "intercom 3-party",
    "atlas event feed",
  ],
  "main-endpoints"
);

const appIds: string[] = [];
const [
  mainConfigUrl,
  staticConfigUrl,
  basemapStylesUrl,
  intercomUrl,
  eventFeedUrl,
] = apiObjsToTest.map((apiObj) => {
  if (apiObj?.appId) appIds.push(apiObj?.appId);
  return apiObj?.url;
});

const [intercomAppId] = appIds;

test(
  `Check ${mainConfigUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
    expect(mainConfigUrl).toBeDefined();
    const response = await request.get(mainConfigUrl!);
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj.id).toEqual("9043acf9-2cf3-48ac-9656-a5d7c4b7593d");
    expect(responseObj.name).toEqual("Kontur Atlas");
    expect(responseObj.description).toEqual("Kontur SAAS application");
    expect(responseObj.features[0]).toBeDefined();
  }
);

test(
  `Check ${staticConfigUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
    expect(staticConfigUrl).toBeDefined();
    const response = await request.get(staticConfigUrl!);
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj.API_GATEWAY).toEqual("/active/api");
    expect(responseObj.OSM_EDITORS[0]).toBeDefined();
    expect(responseObj.FEATURES_BY_DEFAULT[0]).toBeDefined();
  }
);

test(
  `Check ${basemapStylesUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
    expect(basemapStylesUrl).toBeDefined();
    const response = await request.get(basemapStylesUrl!);
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj.layers[0]).toBeDefined();
  }
);

test(
  `Check ${intercomUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
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
  }
);

test(
  `Check ${eventFeedUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
    expect(eventFeedUrl).toBeDefined();
    const response = await request.get(eventFeedUrl!);
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj[0].feed).toEqual("kontur-public");
  }
);
