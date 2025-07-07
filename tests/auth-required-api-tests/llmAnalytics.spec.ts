import { test, expect } from "@playwright/test";
import { getApis, getJSON } from "../helpers/main-helper";
import langdetect from "langdetect";

const languagesToTestLlm = ["ar", "en"];
const requestLlmBody = getJSON({
  fileName: "llm-request",
  fileFolder: "request-bodies",
});
const [llmAnalyticsUrl] = getApis(["llmAnalytics"], "llm-analytics").map(
  (apiObj) => apiObj?.url
);

languagesToTestLlm.forEach((languageToTestLlm) => {
  test(
    `Check ${llmAnalyticsUrl} to give correct language response (${languageToTestLlm})`,
    { tag: "@pro_user" },
    async ({ request }) => {
      expect(
        llmAnalyticsUrl,
        `Expect llm analytics url to be defined`
      ).toBeDefined();
      const response = await request.post(llmAnalyticsUrl!, {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          Accept: "application/json",
          "User-Language": languageToTestLlm,
        },
        data: requestLlmBody,
        timeout: 60000,
      });
      expect(response.status(), `Expect response status to be 200`).toEqual(
        200
      );
      const responseObj = await response.json();
      expect(
        responseObj.data,
        `Expect response data to be defined`
      ).toBeDefined();
      expect(
        responseObj.data.length,
        `Expect response object to have more than 0 length`
      ).toBeGreaterThan(0);
      const language = langdetect.detectOne(responseObj.data.slice(0, 300));
      expect(
        language,
        `Expect language of response to be ${languageToTestLlm}`
      ).toEqual(languageToTestLlm);
    }
  );
});
