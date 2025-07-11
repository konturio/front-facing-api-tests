import { test, expect } from "@playwright/test";
import { getApis } from "../helpers/main-helper";
import langdetect from "langdetect";

const languagesToTestAssets = ["en", "es", "ar", "de", "uk", "id", "ko"];
const assetsDataObjs = getApis(
  [
    "atlas about page",
    "atlas terms page",
    "atlas privacy page",
    "oam about page",
    "oam terms page",
    "oam privacy page",
    "disaster-ninja about page",
    "disaster-ninja terms page",
    "disaster-ninja privacy page",
    "smart-city about page",
    "smart-city terms page",
    "smart-city privacy page",
  ],
  "ups-assets"
);

const linksAtDNAboutPage = [
  "https://www.kontur.io/",
  "https://www.kontur.io/portfolio/event-feed/",
  "https://data.humdata.org/dataset/kontur-population-dataset",
  `/ "map"`,
  "mailto:hello@kontur.io",
  "https://github.com/konturio",
];

// Once https://kontur.fibery.io/Tasks/Task/BE-Rename-images-at-about-page-(about-atlas-1.png---about-atlas-area-selection.png)-19826 is fixed, update links to images

const linksAtAtlasAboutPage = [
  "about-atlas-cover-with-logo.png",
  "about-atlas-data-flow.png",
  "/pricing",
  "https://www.youtube.com/watch?v=aCXaAYEW0oM::800,470,true",
  "https://www.youtube.com/watch?v=g7WMD10DMPs::800,470,true",
  "https://www.kontur.io/atlas",
  "https://www.youtube.com/watch?v=Md5Mex-POBo::800,470,true",
];
const linksAtSmartCityAboutPage = [
  "https://www.kontur.io/blog/waste-management/",
  "https://www.kontur.io/solutions/dispatcher-112/",
  "mailto:hello@kontur.io",
];

const linksAtOAMAboutPage = [
  "https://openaerialmap.org/assets/graphics/meta/oam-logo-h-pos.svg",
  "https://www.hotosm.org/",
  "https://apps.kontur.io/raster-tiler/oam/mosaic/{zoom}/{x}/{y}.png",
  `/ "map"`,
  "https://creativecommons.org/licenses/by/4.0/",
  "https://openimagerynetwork.github.io/",
  "https://github.com/hotosm/OpenAerialMap",
  "https://map.openaerialmap.org/",
  "https://www.kontur.io/",
  "mailto:hello@kontur.io",
];

const linksAtTermsPage = [
  "https://www.kontur.io",
  "https://atlas.kontur.io",
  "https://maps.kontur.io",
  "https://disaster.ninja",
  "https://new.openaerialmap.org/",
  "/about/privacy",
  "hello@kontur.io",
];

const polishTextAtTermsPage = [
  "PRZEGLĄD",
  "NIP spółki to 7011042997",
  "MAPY KONTUROWE spółka z ograniczoną odpowiedzialnością z siedzibą w Warszawie, Polska",
  "Użytkownik",
];

const linksAtPrivacyPage = [
  "https://www.kontur.io",
  "https://atlas.kontur.io",
  "https://maps.kontur.io",
  "https://disaster.ninja",
  "https://new.openaerialmap.org/",
  "https://support.google.com/analytics/answer/6004245",
  "https://www.linkedin.com/legal/privacy-policy",
  "https://x.com/en/privacy",
  "https://www.facebook.com/privacy/policy/",
  "https://yandex.com/support/metrica/general/opt-out.html",
  "https://metrica.yandex.com/about/info/privacy-policy",
  "https://docs.sentry.io/product/sentry-basics/#how-to-get-the-most-out-of-sentry",
  "https://www.intercom.com/legal/privacy",
  "/about/cookies",
  "www.youronlinechoices.com",
  "mailto:hello@kontur.io",
];

assetsDataObjs.forEach((assetsDataObj) => {
  test.describe(`Testing ${assetsDataObj?.name ?? "unknown assets data object"}`, () => {
    languagesToTestAssets.forEach((expectedLanguage) => {
      test.describe(`${expectedLanguage.toUpperCase()} locale`, () => {
        test(
          `Check ${assetsDataObj?.url ?? "unknown"} language response and links correctness`,
          { tag: "@guest" },
          async ({ request }) => {
            test.info().annotations.push(
              {
                type: `url`,
                description: assetsDataObj?.url ?? "unknown",
              },
              {
                type: `language`,
                description: expectedLanguage,
              },
              {
                type: `app name`,
                description:
                  assetsDataObj?.name ?? "unknown assets data object",
              }
            );
            test.fail(
              !assetsDataObj?.url || !assetsDataObj?.name,
              "Asset data not found"
            );
            test.fixme(
              expectedLanguage !== "en",
              "Implement https://kontur.fibery.io/Tasks/Task/add-translated-About-pages-to-user-profile-api-repo-18359 to activate this test"
            );
            // Send a GET request to the URL with the specific language header
            const response = await request.get(assetsDataObj.url, {
              headers: {
                "User-Language": expectedLanguage,
              },
            });
            expect(
              response.status(),
              `Response status of request should be 200`
            ).toEqual(200);

            // Extract the response text to perform language and link checks
            const responseTxt = await response.text();
            expect(
              responseTxt.length,
              `Response text of request should not be empty`
            ).toBeGreaterThan(0);

            // Detect the actual language of the response text
            const actualLanguage = langdetect.detectOne(
              responseTxt.slice(0, 1000)
            );

            switch (assetsDataObj.name) {
              case "atlas about page":
                linksAtAtlasAboutPage.forEach((link) =>
                  expect
                    .soft(
                      responseTxt,
                      `Expect link ${link} to be present in the response text`
                    )
                    .toContain(link)
                );
                break;

              case "oam about page":
                linksAtOAMAboutPage.forEach((link) =>
                  expect
                    .soft(
                      responseTxt,
                      `Expect link ${link} to be present in the response text`
                    )
                    .toContain(link)
                );
                break;

              case "disaster-ninja about page":
                linksAtDNAboutPage.forEach((link) =>
                  expect
                    .soft(
                      responseTxt,
                      `Expect link ${link} to be present in the response text`
                    )
                    .toContain(link)
                );
                break;

              case "smart-city about page":
                linksAtSmartCityAboutPage.forEach((link) =>
                  expect
                    .soft(
                      responseTxt,
                      `Expect link ${link} to be present in the response text`
                    )
                    .toContain(link)
                );
                break;

              default:
                // Handle terms and privacy pages with separate fixme and link checks
                if (assetsDataObj.name.includes("terms page")) {
                  linksAtTermsPage.forEach((link) =>
                    expect
                      .soft(
                        responseTxt,
                        `Expect link ${link} to be present in the response text`
                      )
                      .toContain(link)
                  );
                  polishTextAtTermsPage.forEach((text) =>
                    expect
                      .soft(
                        responseTxt,
                        `Expect text '${text}' to be present in the response text`
                      )
                      .toContain(text)
                  );
                }
                if (assetsDataObj.name.includes("privacy page")) {
                  linksAtPrivacyPage.forEach((link) =>
                    expect
                      .soft(
                        responseTxt,
                        `Expect link ${link} to be present in the response text`
                      )
                      .toContain(link)
                  );
                }
                break;
            }
            expect(
              actualLanguage,
              `Expect actual language of response to be ${expectedLanguage}`
            ).toEqual(expectedLanguage);
          }
        );
      });
    });
  });
});
