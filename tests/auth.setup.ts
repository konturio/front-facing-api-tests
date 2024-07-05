import { test as setup } from "@playwright/test";
import { expect } from "@playwright/test";

import { rejectIfTimeout } from "./helper";

let authEndpoint: string;

switch (process.env.ENVIRONMENT) {
  case "prod":
    authEndpoint =
      "https://keycloak01.kontur.io/realms/kontur/protocol/openid-connect/token";
    break;
  case "test":
    authEndpoint =
      "https://keycloak01.konturlabs.com/realms/test/protocol/openid-connect/token";
    break;
  case "dev":
    authEndpoint =
      "https://dev-keycloak.k8s-01.konturlabs.com/realms/dev/protocol/openid-connect/token";
    break;
}

setup("Authentication as a PRO user", async ({ request }) => {
  const response = await Promise.race([
    request.post(authEndpoint, {
      form: {
        username: process.env.EMAIL_PRO!,
        password: process.env.PASSWORD_PRO!,
        client_id: "kontur_platform",
        grant_type: "password",
      },
    }),
    rejectIfTimeout(10),
  ]);
  expect(response.status()).toEqual(200);
  const responseBody = await response.json();
  const accessToken = responseBody.access_token;
  process.env["ACCESS_TOKEN"] = accessToken;
});
