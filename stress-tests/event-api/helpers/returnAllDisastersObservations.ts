import { URL } from "url";
import EventApiRequestProfiler from "./requestProfiler.ts";

const getAllDisastersAndObservations = async function (
  url: URL,
  eventApiRequestProfiler: EventApiRequestProfiler
) {
  const {
    startTime,
    responseStatus,
    responseTimeMs,
    payloadSize,
    body,
    error,
  } = await eventApiRequestProfiler.fetchWithMetrics(url);
  if (responseStatus !== 200)
    throw new Error(
      `Searching events gave non-200 response status: ${responseStatus}`
    );
  const validResponseBody = body as {
    pageMetadata: { nextAfterValue: string };
    data: { eventId: string; observations: string[] }[];
  };
  const { disasters, observations } = validResponseBody?.data?.reduce(
    (acc, event) => {
      acc.disasters.push(event.eventId);
      acc.observations.push(event.observations);
      return acc;
    },
    {
      disasters: [] as string[],
      observations: [] as string[][],
    }
  );
  return {
    startTime: new Date(startTime).toISOString(),
    url: url.toString(),
    responseStatus,
    responseTimeMs,
    payloadSize,
    disasterIDs: [...new Set(disasters)].sort(),
    observationIDs: [...new Set(observations.flat(Infinity))].sort(),
    error,
  };
};

export default getAllDisastersAndObservations;
