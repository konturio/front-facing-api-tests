import { test, expect, APIRequestContext } from "@playwright/test";
import { getApis, getRequestBody } from "./helper";

const [liveSensorUrl] = getApis(["live sensor"]).map((apiObj) => apiObj?.url);
const liveSensorBody = getRequestBody("liveSensor.json");
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
  test(`Answer is 200 ok`, async ({ request }) => {
    await testLiveSensor({
      request,
      liveSensorUrl,
      liveSensorBody,
      accessToken,
      contentType: "application/json",
      expectedResponseStatus: 200,
    });
  });
  test(`Answer is 400 (wrong body)`, async ({ request }) => {
    const errorText = await testLiveSensor({
      request,
      liveSensorUrl,
      liveSensorBody: { hello: "world" },
      accessToken,
      contentType: "application/json",
      expectedResponseStatus: 400,
    });
    expect(errorText).toEqual("Malformed JSON request");
  });
  test(`Answer is 400 (no body)`, async ({ request }) => {
    const errorText = await testLiveSensor({
      request,
      liveSensorUrl,
      accessToken,
      contentType: "application/json",
      expectedResponseStatus: 400,
    });
    expect(errorText).toEqual("Malformed JSON request");
  });
  test(`Answer is 403`, async ({ request }) => {
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
  test(`Answer is 415`, async ({ request }) => {
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
