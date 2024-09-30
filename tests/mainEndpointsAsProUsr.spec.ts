import { test, expect } from "@playwright/test";
import { getApis } from "./helper";

const [currentUserUrl, appInfoUrl] = getApis(
  ["current user", "app info"],
  "main-endpoints"
).map((apiObj) => apiObj?.url);

test(
  `Check ${currentUserUrl} availability`,
  { tag: "@pro_user" },
  async ({ request }) => {
    expect(currentUserUrl).toBeDefined();
    const response = await request.get(currentUserUrl!, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
    });
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj.username).toEqual(process.env.EMAIL_PRO);
  }
);

test(`Check ${appInfoUrl} data`, { tag: "@pro_user" }, async ({ request }) => {
  expect(appInfoUrl).toBeDefined();
  const response = await request.get(appInfoUrl!, {
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
  });
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.name).toEqual("Kontur Atlas");
  expect(
    responseObj.featuresConfig.reference_area.referenceAreaGeometry.id
  ).toBeDefined();
  expect(responseObj.extent[0]).toBeDefined();
  expect(responseObj.sidebarIconUrl).toEqual(
    "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg"
  );
  expect(responseObj.faviconUrl).toEqual(
    "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg"
  );
  expect(responseObj.faviconUrl).toEqual(
    "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg"
  );
  expect(responseObj.faviconPack).toStrictEqual({
    "favicon.svg":
      "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg",
    "favicon.ico":
      "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.ico",
    "apple-touch-icon.png":
      "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/apple-touch-icon.png",
    "icon-192x192.png":
      "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/icon-192x192.png",
    "icon-512x512.png":
      "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/icon-512x512.png",
  });
  expect(responseObj.public).toStrictEqual(true);
});
