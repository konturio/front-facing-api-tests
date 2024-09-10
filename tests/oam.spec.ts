import { test, expect, APIRequestContext, TestInfo } from "@playwright/test";
import { getApis } from "./helper";
import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

type testOAMTilesOptions = {
  request: APIRequestContext;
  expectedImgLocation: string;
  expectedRespStatus: number;
  url: string;
  expectedPNGWidth: 256 | 512;
  expectedPNGHeight: 256 | 512;
  expectedPixelsDifference: number;
  testInfo: TestInfo;
  checkImage?: boolean;
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

const testOAMTiles = async function ({
  request,
  expectedImgLocation,
  url,
  expectedRespStatus,
  expectedPNGWidth,
  expectedPNGHeight,
  expectedPixelsDifference,
  testInfo,
  checkImage = true,
}: testOAMTilesOptions) {
  // Get OAM image, waiting 10 secs max and check response status
  const response = await request.get(url, { timeout: 10000 });
  expect(response.status()).toEqual(expectedRespStatus);

  if (checkImage) {
    // Get PNG objects from response and from a sample at test data folder
    const actualImg = PNG.sync.read(await response.body());
    const expectedImg = PNG.sync.read(fs.readFileSync(expectedImgLocation));

    // Create a PNG obj with expected demensions that are equal to dimensions from response and from a sample
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

    expect(numDifferencePixels, {
      message: `The OAM image got differs from expected one in ${numDifferencePixels} pixel(s). See a screenshot in reports`,
    }).toEqual(expectedPixelsDifference);
  }
};

test.describe(`Testing OAM`, () => {
  test(`${makeFirstLetterCapital(oamWithTiles?.name || "no data")} are shown (256px) and give 200 ok`, async ({
    request,
  }, testInfo) => {
    await testOAMTiles({
      request,
      expectedImgLocation: oamWithTiles?.expectedImgAddress,
      url: oamWithTiles?.url,
      testInfo,
      expectedRespStatus: 200,
      expectedPNGWidth: 256,
      expectedPNGHeight: 256,
      expectedPixelsDifference: 0,
    });
  });
  test(`At ${makeFirstLetterCapital(oamNoTiles?.name || "no data")} are shown (256px), but endpoint gives 200 ok`, async ({
    request,
  }, testInfo) => {
    await testOAMTiles({
      request,
      expectedImgLocation: oamNoTiles?.expectedImgAddress,
      url: oamNoTiles?.url,
      testInfo,
      expectedRespStatus: 200,
      expectedPNGWidth: 256,
      expectedPNGHeight: 256,
      expectedPixelsDifference: 0,
    });
  });
});
