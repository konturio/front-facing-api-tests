import { APIRequestContext, test as setup } from "@playwright/test";
import { expect } from "@playwright/test";

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

async function getAccessToken(
  email: string,
  password: string,
  request: APIRequestContext
) {
  const response = await request.post(authEndpoint, {
    form: {
      username: email,
      password: password,
      client_id: "kontur_platform",
      grant_type: "password",
    },
  });
  expect(response.status(), `Keycloak says: ${await response.body()}`).toEqual(
    200
  );
  const responseBody = await response.json();
  const accessToken = responseBody.access_token;
  expect(
    accessToken,
    "Access token should be defined in response"
  ).toBeDefined();
  return accessToken;
}

setup("Authentication as a PRO user", async ({ request }) => {
  process.env["ACCESS_TOKEN"] = await getAccessToken(
    process.env.EMAIL_PRO!,
    process.env.PASSWORD_PRO!,
    request
  );
});

setup("Authentication as an user with no rights", async ({ request }) => {
  process.env["ACCESS_TOKEN_USER_NO_RIGHTS"] = await getAccessToken(
    process.env.EMAIL!,
    process.env.PASSWORD!,
    request
  );
});
