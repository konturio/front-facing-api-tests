import { URL } from "url";

const feed = "kontur-private";
const types = ["FLOOD", "WILDFIRE", "EARTHQUAKE", "CYCLONE", "STORM"];
const limit = 1000;
const token = "token";

const params = {
  feed,
  types,
  limit,
};

const searchAllEventsUrl = new URL("https://apps.kontur.io/events/v1/");
for (const [key, value] of Object.entries(params)) {
  searchAllEventsUrl.searchParams.append(key, String(value));
}

const getAllDisastersAndObservations = async function (url: URL) {
  const startSearchingEventsTime = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const endSearchingEventsTime = Date.now();
    const searchingEventsResponseTimeMs =
      endSearchingEventsTime - startSearchingEventsTime;
    const status = response.status;
    if (status !== 200) {
      throw new Error(
        `Searching events gave non-200 response status: ${status}`
      );
    } else {
      const rawResponse = await response.text();
      const payloadSize = Buffer.byteLength(rawResponse, "utf8");
      const responseBody = JSON.parse(rawResponse);
      const { disasters, observations } = responseBody?.data?.reduce(
        (acc, event) => {
          acc.disasters.push(event.eventId);
          acc.observations.push(event.observations);
          return acc;
        },
        {
          disasters: [],
          observations: [],
        }
      );
      return {
        startTime: new Date(startSearchingEventsTime).toISOString(),
        url: url.toString(),
        responseStatus: status,
        responseTimeMs: searchingEventsResponseTimeMs,
        payloadSize,
        disasterIDs: [...new Set(disasters)].sort(),
        observationIDs: [...new Set(observations.flat(Infinity))].sort(),
      };
    }
  } catch (e) {
    throw new Error(e);
  }
};

console.log("Started getting all disasters and observations...");
const { disasterIDs, observationIDs } =
  await getAllDisastersAndObservations(searchAllEventsUrl);
console.log("Finished getting all disasters and observations...");
console.log(disasterIDs);
console.log("/////////////////");
console.log(observationIDs);
