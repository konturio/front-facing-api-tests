import { test, expect } from "@playwright/test";
import { getApis } from "./helper";

type Layer = {
  id: string;
};

const languagesToTestLayers = ["es", "en", "ar", "de", "uk", "id", "ko"];
const apiObjsToTest = getApis(
  ["atlas layers", "atlas global layers"],
  "layers"
);

const appIds: string[] = [];
const [atlasLayersUrl, atlasGlobalLayersUrl] = apiObjsToTest.map((apiObj) => {
  if (apiObj?.appId) appIds.push(apiObj?.appId);
  return apiObj?.url;
});

const [atlasAppId] = appIds;

languagesToTestLayers.forEach((language) => {
  test(
    `Check ${atlasLayersUrl} to give correct language response (${language}) and style ninja json content to match ${language} locale`,
    { tag: "@guest" },
    async ({ request }) => {
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
    }
  );
});

test(
  `Check ${atlasGlobalLayersUrl} availability`,
  { tag: "@guest" },
  async ({ request }) => {
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
  }
);
