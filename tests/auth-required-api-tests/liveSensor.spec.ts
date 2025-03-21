import { test, expect, APIRequestContext } from "@playwright/test";
import { getApis, getJSON } from "../helper";

const [liveSensorUrl] = getApis(["live sensor"], "live-sensor").map(
  (apiObj) => apiObj?.url
);
const liveSensorBody = getJSON({
  fileName: "live-sensor",
  fileFolder: "request-bodies",
});
const accessToken = process.env.ACCESS_TOKEN;

type liveSensorRequestOptions = {
  request: APIRequestContext;
  liveSensorUrl: string | undefined;
  liveSensorBody?: {};
  accessToken?: string;
  contentType: string;
  expectedResponseStatus: number;
  isResponseJSON?: boolean;
};

const testLiveSensor = async function ({
  request,
  liveSensorUrl,
  liveSensorBody,
  accessToken,
  contentType,
  expectedResponseStatus,
  isResponseJSON,
}: liveSensorRequestOptions) {
  expect(liveSensorUrl).toBeDefined();
  const response = await request.post(liveSensorUrl!, {
    data: liveSensorBody,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
  });
  expect(response.status()).toEqual(expectedResponseStatus);
  return isResponseJSON ? await response.json() : await response.text();
};

test.describe(`Check ${liveSensorUrl}`, () => {
  test(`Answer is 200 ok`, { tag: "@pro_user" }, async ({ request }) => {
    await testLiveSensor({
      request,
      liveSensorUrl,
      liveSensorBody,
      accessToken,
      contentType: "application/json",
      expectedResponseStatus: 200,
    });
  });
  test(
    `Answer is 400 (wrong body)`,
    { tag: "@pro_user" },
    async ({ request }) => {
      const errorText = await testLiveSensor({
        request,
        liveSensorUrl,
        liveSensorBody: { hello: "world" },
        accessToken,
        contentType: "application/json",
        expectedResponseStatus: 400,
      });
      expect(errorText).toEqual("Malformed JSON request");
    }
  );
  test(`Answer is 400 (no body)`, { tag: "@pro_user" }, async ({ request }) => {
    const errorText = await testLiveSensor({
      request,
      liveSensorUrl,
      accessToken,
      contentType: "application/json",
      expectedResponseStatus: 400,
    });
    expect(errorText).toEqual("Malformed JSON request");
  });
  test(`Answer is 403`, { tag: "@guest" }, async ({ request }) => {
    const errorObj = await testLiveSensor({
      request,
      liveSensorUrl,
      liveSensorBody,
      accessToken: "Bearer 123",
      contentType: "application/json",
      expectedResponseStatus: 403,
      isResponseJSON: true,
    });
    expect(errorObj).toBeDefined();
    expect(errorObj?.status).toEqual(403);
    expect(errorObj?.error).toEqual("Forbidden");
    expect(errorObj?.path).toEqual("/active/api/features/live-sensor");
  });
  test(`Answer is 415`, { tag: "@pro_user" }, async ({ request }) => {
    await testLiveSensor({
      request,
      liveSensorUrl,
      liveSensorBody,
      accessToken,
      contentType: "application/pdf",
      expectedResponseStatus: 415,
    });
  });
});
