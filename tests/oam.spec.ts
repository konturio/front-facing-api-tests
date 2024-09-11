import { test, expect, APIRequestContext, TestInfo } from "@playwright/test";
import { getApis } from "./helper";
import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const sizes = [256, 512] as [256, 512];

type testOAMTilesOptions = {
  request: APIRequestContext;
  expectedImgLocation: string;
  expectedRespStatus: number;
  url: string;
  expectedPNGWidth: 256 | 512;
  expectedPNGHeight: 256 | 512;
  expectedPixelsDifference: number;
  testInfo: TestInfo;
};

const [oamWithTiles, oamNoTiles, clusterWithTiles, clusterWithNoTiles] =
  getApis([
    "oam tiles",
    "oam no tiles",
    "cluster with tiles",
    "cluster with no tiles",
  ]);

const makeFirstLetterCapital = (text: string) =>
  `${text[0].toUpperCase()}${text.slice(1)}`;

const getPositiveNumbersOutOfString = (text: string) =>
  text
    .split("")
    // The text input can be in mvt format. Using !isNaN(+symbol) is not effective. The easiest solution is to extract numbers from mvt is below
    .filter((symbol) => +symbol > 0 && +symbol <= 9)
    .join("");

const testOAMTiles = async function ({
  request,
  expectedImgLocation,
  url,
  expectedRespStatus,
  expectedPNGWidth,
  expectedPNGHeight,
  expectedPixelsDifference,
  testInfo,
}: testOAMTilesOptions) {
  const response =
    await test.step("Get OAM image, waiting 10 secs max and check response status", async () =>
      await request.get(url, { timeout: 10000 }));

  expect(response.status(), `Should answer ${expectedRespStatus} `).toEqual(
    expectedRespStatus
  );

  // Get PNG objects from response and from a sample at test data folder
  const actualImg = PNG.sync.read(
    await test.step("Processing response, getting its body", async () =>
      await response.body())
  );
  const expectedImg = PNG.sync.read(fs.readFileSync(expectedImgLocation));

  // Create a PNG obj with expected demensions (they should be equal to dimensions from response and from a sample)
  const differenceImg = new PNG({
    width: expectedPNGWidth,
    height: expectedPNGHeight,
  });

  // Run main function that gives out a number of pixels that differ between images
  const numDifferencePixels = pixelmatch(
    expectedImg.data,
    actualImg.data,
    differenceImg.data,
    expectedPNGWidth,
    expectedPNGHeight
  );

  // Write image with difference manually to test-results
  fs.writeFileSync(
    `test-results/${testInfo.title}.png`,
    PNG.sync.write(differenceImg)
  );

  // Add image with difference to the report
  await testInfo.attach("Difference between expected OAM image and actual", {
    body: fs.readFileSync(`test-results/${testInfo.title}.png`),
    contentType: "image/png",
  });

  expect(
    numDifferencePixels,
    `The OAM image got differs from expected one in ${numDifferencePixels === 0 ? "no" : numDifferencePixels} pixel(s)`
  ).toEqual(expectedPixelsDifference);
};

// Test cases are here

test.describe(`Testing OAM mosaic`, () => {
  sizes.forEach((size) => {
    test(`${makeFirstLetterCapital(oamWithTiles?.name || "no data")} are shown (${size}px) and give 200 ok`, async ({
      request,
    }, testInfo) => {
      await testOAMTiles({
        request,
        expectedImgLocation:
          oamWithTiles[
            size === 256 ? "expectedImgAddress" : "expectedLargeImgAddress"
          ],
        url: oamWithTiles[size === 256 ? "url" : "urlLargeImg"],
        testInfo,
        expectedRespStatus: 200,
        expectedPNGWidth: size,
        expectedPNGHeight: size,
        expectedPixelsDifference: 0,
      });
    });
    test(`At ${makeFirstLetterCapital(oamNoTiles?.name || "no data")} are shown (${size}px), but endpoint gives 200 ok`, async ({
      request,
    }, testInfo) => {
      await testOAMTiles({
        request,
        expectedImgLocation:
          oamNoTiles[
            size === 256 ? "expectedImgAddress" : "expectedLargeImgAddress"
          ],
        url: oamNoTiles[size === 256 ? "url" : "urlLargeImg"],
        testInfo,
        expectedRespStatus: 200,
        expectedPNGWidth: size,
        expectedPNGHeight: size,
        expectedPixelsDifference: 0,
      });
    });
  });
});

test.describe(`Testing OAM mosaic clusters`, () => {
  test(`${makeFirstLetterCapital(clusterWithTiles?.name || "no data")} endpoint should say about ${clusterWithTiles?.expectedNumImages} images in it and response 200 ok`, async ({
    request,
  }) => {
    const response =
      await test.step(`Send GET request to ${clusterWithTiles?.name} endpoint`, async () =>
        await request.get(clusterWithTiles?.url));
    expect(
      response.status(),
      `${clusterWithTiles.url} should answer 200`
    ).toEqual(200);
    const text =
      await test.step("Getting text out of response body", async () =>
        await response.text());
    expect(text.length, `Expect length of text to be > 0`).toBeGreaterThan(0);
    expect(
      getPositiveNumbersOutOfString(text),
      `Cluster should have ${clusterWithTiles?.expectedNumImages} images`
    ).toEqual(clusterWithTiles?.expectedNumImages);
  });

  test(`Test ${clusterWithNoTiles?.name} to give 200 ok and no answer`, async ({
    request,
  }) => {
    const response =
      await test.step(`Send GET request to ${clusterWithNoTiles?.name} endpoint`, async () =>
        await request.get(clusterWithNoTiles?.url));
    expect(
      response.status(),
      `${clusterWithNoTiles.url} should answer 200`
    ).toEqual(200);
    const text =
      await test.step("Getting text out of response body", async () =>
        await response.text());
    expect(text, `Expect to be no info`).toHaveLength(0);
  });
});
