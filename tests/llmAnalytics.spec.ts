import { test, expect } from "@playwright/test";
import { getApis, getRequestBody } from "./helper";
import langdetect from "langdetect";

const languagesToTestLlm = ["ar", "en"];
const requestLlmBody = getRequestBody("llm-request");
const [llmAnalyticsUrl] = getApis(["llmAnalytics"], "llm-analytics").map(
  (apiObj) => apiObj?.url
);

languagesToTestLlm.forEach((languageToTestLlm) => {
  test(`Check ${llmAnalyticsUrl} to give correct language response (${languageToTestLlm})`, async ({
    request,
  }) => {
    expect(llmAnalyticsUrl).toBeDefined();
    const response = await request.post(llmAnalyticsUrl!, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        Accept: "application/json",
        "User-Language": languageToTestLlm,
      },
      data: requestLlmBody,
      timeout: 60000,
    });
    expect(response.status()).toEqual(200);
    const responseObj = await response.json();
    expect(responseObj.data.length).toBeGreaterThan(0);
    const language = langdetect.detectOne(responseObj.data.slice(0, 300));
    expect(language).toEqual(languageToTestLlm);
  });
});