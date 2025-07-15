import { APIRequestContext, TestInfo } from "@playwright/test";

export type PopulationAnalytics = {
  admin: string;
  populationData: {
    id: "population" | "gdp" | "urban";
    minExpectedResult: number;
    maxExpectedResult: number;
  }[];
};

export type ThermalSpotsAnalytics = {
  admin: string;
  thermalSpotsData: {
    id:
      | "volcanoesCount"
      | "hotspotDaysPerYearMax"
      | "industrialAreaKm2"
      | "forestAreaKm2";
    minExpectedResult: number;
    maxExpectedResult: number;
  }[];
};

export type TestAxisOptions = {
  request: APIRequestContext;
  expectedStatus: number;
  expectValidity: boolean;
  minQuality?: number | string;
  expectedError?: string;
};

export type Layer = {
  id: string;
};

export type AxisData = {
  label: null;
  steps: { label: null; value: number }[];
  datasetStats: {
    minValue: number;
    maxValue: number;
    mean: number;
    stddev: number;
  };
  quotient: [string, string];
  quotients: {
    name: string;
    label: string;
    emoji?: string;
    maxZoom: number;
    description: string;
    copyrights: string[];
    direction: [string][];
    unit: {
      id: string;
      shortName: string;
      longName: string;
    };
  }[];
  quality: number;
  transformation: {
    transformation: string;
    mean: number;
    skew: number;
    stddev: number;
    lowerBound: number;
    upperBound: number;
  };
  parent: null;
}[];

export type testSearchApiOptions = {
  searchApi: Api;
  request: APIRequestContext;
  query: string;
  expectedResponseBody: {} | string;
  authToken?: string;
  expectedStatus?: number;
};

export type liveSensorRequestOptions = {
  request: APIRequestContext;
  liveSensorUrl: string | undefined;
  liveSensorBody?: {};
  accessToken?: string;
  contentType: string;
  expectedResponseStatus: number;
  isResponseJSON?: boolean;
};

export type OsmAnalytics = {
  admin: string;
  osmData: {
    id:
      | "areaWithoutOsmBuildingsKm2"
      | "areaWithoutOsmRoadsKm2"
      | "osmBuildingGapsPercentage"
      | "osmRoadGapsPercentage"
      | "osmBuildingsCount"
      | "osmUsersCount"
      | "osmUsersHours"
      | "localOsmUsersHours"
      | "aiBuildingsCountEstimation";
    minExpectedResult: number;
    maxExpectedResult: number;
  }[];
};

export type FunctionsAnalytics = {
  admin: string;
  functionsData: {
    id:
      | "populatedareakm2"
      | "industrialareakm2"
      | "forestareakm2"
      | "volcanoescount"
      | "hotspotdaysperyearmax"
      | "osmgapspercentage"
      | "osmgapssum";
    minExpectedResult: number;
    maxExpectedResult: number;
  }[];
};

export type Api = {
  env: string;
  name: string;
  url: string;
  urlLargeImg?: string;
  appId?: string;
  expectedImgAddress?: string;
  expectedLargeImgAddress?: string;
  expectedNumImages?: number;
};

export type TestedGeojson = {
  type: string;
  features: {
    type: string;
    properties: { ADMIN: string; ISO_A3: string; timestamp: number };
    geometry: { type: string; coordinates: [] };
  }[];
};

export type Stat = {
  id: string;
  result: number | null;
};

export type Analytics = {
  value: number;
  calculation: string;
  quality: number;
};

/**
 * Type representing population analytics data for a region
 * @property population - Total population count
 * @property gdp - Gross Domestic Product in USD
 * @property urban - Urban population count
 */

export type PopulationData = {
  population: number;
  gdp: number;
  urban: number;
};

export type TestOAMTilesOptions = {
  request: APIRequestContext;
  expectedImgLocation: string;
  expectedRespStatus: number;
  url: string;
  expectedPNGWidth: 256 | 512;
  expectedPNGHeight: 256 | 512;
  expectedPixelsDiff: number;
  testInfo: TestInfo;
};

type FormulaData = {
  consumers: (
    | "hot"
    | "disasterNinja"
    | "eventAPI"
    | "Honey Fombuena at DN"
    | "Smart City"
    | "Oasis"
    | "ODIN"
    | "Hazard Compass"
    | "Terrain"
    | "kontur.io"
    | "HORAM"
    | "GlobalGiving"
  )[];
  id: string;
  testedIn: string | null;
};

export type InsightsApiConsumersData = {
  sumX: {
    population: FormulaData;
    populated_area_km2: FormulaData;
    building_count: FormulaData;
    highway_length: FormulaData;
    osm_users: FormulaData;
    building_count_6_months: FormulaData;
    highway_length_6_months: FormulaData;
    total_building_count: FormulaData;
    total_road_length: FormulaData;
    total_hours: FormulaData;
    local_hours: FormulaData;
    industrial_area: FormulaData;
    forest: FormulaData;
    volcanos_count: FormulaData;
    area_km2: FormulaData;
    osm_public_transport_stops_count: FormulaData;
    osm_car_parkings_capacity: FormulaData;
    osm_railway_stations_count: FormulaData;
    osm_airports_count: FormulaData;
    osm_pharmacy_count: FormulaData;
    osm_defibrillators_count: FormulaData;
    sports_and_recreation_fsq_count: FormulaData;
    osm_hotels_count: FormulaData;
    landmarks_and_outdoors_fsq_count: FormulaData;
    arts_and_entertainment_fsq_count: FormulaData;
    permanent_water: FormulaData;
  };
  percentageXWhereNoY: {
    "populated_area_km2/building_count": FormulaData;
    "populated_area_km2/highway_length": FormulaData;
    "populated_area_km2/count": FormulaData;
    "area_km2/building_count": FormulaData;
  };
  avgX: {
    avgmax_ts: FormulaData;
    ghs_avg_building_height: FormulaData;
    avg_forest_canopy_height: FormulaData;
    worldclim_avg_temperature: FormulaData;
    avg_elevation_gebco_2022: FormulaData;
    days_maxtemp_over_32c_1c: FormulaData;
    days_mintemp_above_25c_1c: FormulaData;
  };
  maxX: {
    avgmax_ts: FormulaData;
    wildfires: FormulaData;
    ghs_max_building_height: FormulaData;
    drought_days_count: FormulaData;
    worldclim_max_temperature: FormulaData;
    hazardous_days_count: FormulaData;
    cyclone_days_count: FormulaData;
    earthquake_days_count: FormulaData;
    flood_days_count: FormulaData;
    volcano_days_count: FormulaData;
    wildfire_days_count: FormulaData;
  };
  sumXWhereNoY: {
    "populated_area_km2/building_count": FormulaData;
    "populated_area_km2/highway_length": FormulaData;
    "populated_area_km2/count": FormulaData;
  };
  population: {
    population: FormulaData;
    gdp: FormulaData;
  };
};

export type FilteredInsightsApiConsumersData = {
  [K in keyof InsightsApiConsumersData]?: {
    [F in keyof InsightsApiConsumersData[K]]?: InsightsApiConsumersData[K][F];
  };
};

export type SearchEventApiResponse = {
  pageMetadata: { nextAfterValue: string };
  data: Array<{
    eventId: string;
    name: string;
    description: string;
    version: string;
    type: string;
    severity: string;
    active: boolean;
    startedAt: string;
    endedAt: string;
    updatedAt: string;
    location: string;
    urls: string[];
    observations: string[];
  }>;
};

export type RawDataResponse = {
  EventSource: string;
  EventVersion: string;
  EventSubscriptionArn: string;
  Sns: {
    Type: string;
    MessageId: string;
    TopicArn: string;
    Subject: string | null;
    Message: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertUrl: string;
    UnsubscribeUrl: string;
    MessageAttributes: Record<string, unknown>;
  };
};
