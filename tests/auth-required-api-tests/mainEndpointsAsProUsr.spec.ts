import { test, expect } from "@playwright/test";
import { getApis } from "../helpers/main-helper";

const [currentUserUrl, appInfoUrl] = getApis(
  ["current user", "app info"],
  "main-endpoints"
).map((apiObj) => apiObj?.url);

test(
  `Check ${currentUserUrl} availability`,
  { tag: "@pro_user" },
  async ({ request }) => {
    expect(
      currentUserUrl,
      `Expect current user url to be defined`
    ).toBeDefined();
    const response = await request.get(currentUserUrl!, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
    });
    expect(response.status(), "Expect response status to be 200").toEqual(200);
    const responseObj = await response.json();
    expect(
      responseObj.username,
      `Expect username from response to equal ${process.env.EMAIL_PRO}`
    ).toEqual(process.env.EMAIL_PRO);
  }
);

test(`Check ${appInfoUrl} data`, { tag: "@pro_user" }, async ({ request }) => {
  expect(appInfoUrl, `Expect app info url to be defined`).toBeDefined();
  const response = await request.get(appInfoUrl!, {
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
  });
  expect(response.status(), `Expect response status to be 200`).toEqual(200);
  const responseObj = await response.json();
  expect(
    responseObj.name,
    `Expect response name to equal 'Kontur Atlas'`
  ).toEqual("Kontur Atlas");
  expect(
    responseObj.featuresConfig.reference_area.referenceAreaGeometry.id,
    `Expect response reference area geometry id to be defined`
  ).toBeDefined();
  expect(
    responseObj.extent[0],
    `Expect response extent to be defined`
  ).toBeDefined();
  expect(
    responseObj.sidebarIconUrl,
    `Expect sidebar icon url to have specific value`
  ).toEqual(
    "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg"
  );
  expect(
    responseObj.faviconUrl,
    `Expect favicon url to have specific value`
  ).toEqual(
    "/active/api/apps/9043acf9-2cf3-48ac-9656-a5d7c4b7593d/assets/favicon.svg"
  );
  expect(
    responseObj.faviconPack,
    `Expect favicon pack to have specific values`
  ).toStrictEqual({
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
  expect(
    responseObj.public,
    `Expect public field in response object to be truthy`
  ).toStrictEqual(true);
});
