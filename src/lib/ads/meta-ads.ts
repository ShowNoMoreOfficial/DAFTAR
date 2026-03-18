/**
 * Meta Ads Manager — Facebook + Instagram campaign management.
 *
 * Uses the official facebook-nodejs-business-sdk to manage campaigns,
 * ad sets, creatives, and fetch performance insights.
 *
 * Requires:
 *   META_APP_ID, META_APP_SECRET (for auth)
 *   A PlatformConnection with platform="meta_ads" or "facebook"
 *   containing a valid access token + ad account ID in config.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import bizSdk from "facebook-nodejs-business-sdk";

const { AdAccount, Campaign, AdSet, Ad, AdCreative } = bizSdk;

// ─── Types ──────────────────────────────────────────────

export type CampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES";

export interface CampaignConfig {
  name: string;
  objective: CampaignObjective;
  dailyBudgetCents: number; // in smallest currency unit (paise for INR)
  status?: "PAUSED" | "ACTIVE";
}

export interface AdSetConfig {
  campaignId: string;
  name: string;
  dailyBudgetCents: number;
  startTime: string; // ISO 8601
  endTime?: string;
  targeting: MetaTargeting;
  optimizationGoal:
    | "REACH"
    | "IMPRESSIONS"
    | "LINK_CLICKS"
    | "LANDING_PAGE_VIEWS"
    | "THRUPLAY"
    | "POST_ENGAGEMENT";
  billingEvent: "IMPRESSIONS" | "LINK_CLICKS";
  status?: "PAUSED" | "ACTIVE";
}

export interface MetaTargeting {
  geoLocations: {
    countries?: string[];
    cities?: Array<{ key: string; name?: string }>;
  };
  ageMin?: number;
  ageMax?: number;
  genders?: number[]; // 1=male, 2=female
  interests?: Array<{ id: string; name: string }>;
  customAudiences?: Array<{ id: string; name?: string }>;
  excludedCustomAudiences?: Array<{ id: string; name?: string }>;
}

export interface AdConfig {
  adSetId: string;
  name: string;
  creativeId: string;
  status?: "PAUSED" | "ACTIVE";
}

export interface CreativeConfig {
  name: string;
  pageId: string;
  message?: string;
  link?: string;
  imageHash?: string;
  imageUrl?: string;
  videoId?: string;
  callToAction?: {
    type: string;
    value: { link: string };
  };
}

export interface CampaignInsights {
  impressions: number;
  reach: number;
  clicks: number;
  spend: string;
  cpc: string;
  cpm: string;
  ctr: string;
  actions: Array<{ action_type: string; value: string }>;
  dateStart: string;
  dateStop: string;
}

// ─── Manager Class ──────────────────────────────────────

export class MetaAdsManager {
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.adAccountId = adAccountId.startsWith("act_")
      ? adAccountId
      : `act_${adAccountId}`;
    bizSdk.FacebookAdsApi.init(accessToken);
  }

  // ─── Campaigns ──────────────────────────────────────

  async createCampaign(config: CampaignConfig): Promise<any> {
    const account = new AdAccount(this.adAccountId);
    const campaign = await account.createCampaign([], {
      name: config.name,
      objective: config.objective,
      status: config.status || "PAUSED",
      special_ad_categories: [],
      daily_budget: config.dailyBudgetCents,
    });
    return campaign;
  }

  async getCampaigns(): Promise<any[]> {
    const account = new AdAccount(this.adAccountId);
    const campaigns = await account.getCampaigns(
      [
        "id",
        "name",
        "objective",
        "status",
        "daily_budget",
        "lifetime_budget",
        "created_time",
        "updated_time",
        "start_time",
        "stop_time",
      ],
      { limit: 50 },
    );
    return campaigns;
  }

  async getCampaignInsights(
    campaignId: string,
    datePreset: string = "last_7d",
  ): Promise<CampaignInsights[]> {
    const campaign = new Campaign(campaignId);
    const insights = await campaign.getInsights(
      [
        "impressions",
        "reach",
        "clicks",
        "spend",
        "cpc",
        "cpm",
        "ctr",
        "actions",
        "date_start",
        "date_stop",
      ],
      { date_preset: datePreset, level: "campaign" },
    );
    return insights.map((i: any) => ({
      impressions: parseInt(i.impressions || "0"),
      reach: parseInt(i.reach || "0"),
      clicks: parseInt(i.clicks || "0"),
      spend: i.spend || "0",
      cpc: i.cpc || "0",
      cpm: i.cpm || "0",
      ctr: i.ctr || "0",
      actions: i.actions || [],
      dateStart: i.date_start,
      dateStop: i.date_stop,
    }));
  }

  async updateCampaignStatus(
    campaignId: string,
    status: "PAUSED" | "ACTIVE" | "DELETED",
  ): Promise<any> {
    const campaign = new Campaign(campaignId);
    return campaign.update([], { status });
  }

  // ─── Ad Sets ────────────────────────────────────────

  async createAdSet(config: AdSetConfig): Promise<any> {
    const account = new AdAccount(this.adAccountId);
    const targeting = buildTargetingSpec(config.targeting);

    const adSet = await account.createAdSet([], {
      name: config.name,
      campaign_id: config.campaignId,
      daily_budget: config.dailyBudgetCents,
      start_time: config.startTime,
      end_time: config.endTime || undefined,
      targeting,
      optimization_goal: config.optimizationGoal,
      billing_event: config.billingEvent,
      status: config.status || "PAUSED",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    });
    return adSet;
  }

  async getAdSets(campaignId: string): Promise<any[]> {
    const campaign = new Campaign(campaignId);
    const adSets = await campaign.getAdSets(
      [
        "id",
        "name",
        "status",
        "daily_budget",
        "targeting",
        "optimization_goal",
        "start_time",
        "end_time",
      ],
      { limit: 50 },
    );
    return adSets;
  }

  // ─── Creatives ──────────────────────────────────────

  async createCreative(config: CreativeConfig): Promise<any> {
    const account = new AdAccount(this.adAccountId);

    const creativeSpec: Record<string, unknown> = {
      name: config.name,
      object_story_spec: {
        page_id: config.pageId,
        link_data: {
          message: config.message || "",
          link: config.link || "",
          image_hash: config.imageHash || undefined,
          picture: config.imageUrl || undefined,
          call_to_action: config.callToAction || undefined,
        },
      },
    };

    // If video, use video_data instead of link_data
    if (config.videoId) {
      creativeSpec.object_story_spec = {
        page_id: config.pageId,
        video_data: {
          video_id: config.videoId,
          message: config.message || "",
          call_to_action: config.callToAction || undefined,
        },
      };
    }

    const creative = await account.createAdCreative([], creativeSpec);
    return creative;
  }

  // ─── Ads ────────────────────────────────────────────

  async createAd(config: AdConfig): Promise<any> {
    const account = new AdAccount(this.adAccountId);
    const ad = await account.createAd([], {
      name: config.name,
      adset_id: config.adSetId,
      creative: { creative_id: config.creativeId },
      status: config.status || "PAUSED",
    });
    return ad;
  }

  // ─── Account Info ───────────────────────────────────

  async getAccountInfo(): Promise<any> {
    const account = new AdAccount(this.adAccountId);
    const fields = [
      "id",
      "name",
      "account_status",
      "currency",
      "timezone_name",
      "amount_spent",
      "balance",
    ];
    const info = await account.get(fields);
    return info;
  }

  async getAccountInsights(
    datePreset: string = "last_7d",
  ): Promise<CampaignInsights[]> {
    const account = new AdAccount(this.adAccountId);
    const insights = await account.getInsights(
      [
        "impressions",
        "reach",
        "clicks",
        "spend",
        "cpc",
        "cpm",
        "ctr",
        "actions",
        "date_start",
        "date_stop",
      ],
      { date_preset: datePreset },
    );
    return insights.map((i: any) => ({
      impressions: parseInt(i.impressions || "0"),
      reach: parseInt(i.reach || "0"),
      clicks: parseInt(i.clicks || "0"),
      spend: i.spend || "0",
      cpc: i.cpc || "0",
      cpm: i.cpm || "0",
      ctr: i.ctr || "0",
      actions: i.actions || [],
      dateStart: i.date_start,
      dateStop: i.date_stop,
    }));
  }
}

// ─── Helpers ────────────────────────────────────────────

function buildTargetingSpec(targeting: MetaTargeting): Record<string, unknown> {
  const spec: Record<string, unknown> = {};

  // Geo targeting
  const geoLocations: Record<string, unknown> = {};
  if (targeting.geoLocations.countries?.length) {
    geoLocations.countries = targeting.geoLocations.countries;
  }
  if (targeting.geoLocations.cities?.length) {
    geoLocations.cities = targeting.geoLocations.cities;
  }
  spec.geo_locations = geoLocations;

  // Demographics
  if (targeting.ageMin) spec.age_min = targeting.ageMin;
  if (targeting.ageMax) spec.age_max = targeting.ageMax;
  if (targeting.genders?.length) spec.genders = targeting.genders;

  // Interest targeting
  if (targeting.interests?.length) {
    spec.flexible_spec = [
      {
        interests: targeting.interests.map((i) => ({
          id: i.id,
          name: i.name,
        })),
      },
    ];
  }

  // Custom audiences
  if (targeting.customAudiences?.length) {
    spec.custom_audiences = targeting.customAudiences.map((a) => ({
      id: a.id,
    }));
  }
  if (targeting.excludedCustomAudiences?.length) {
    spec.excluded_custom_audiences = targeting.excludedCustomAudiences.map(
      (a) => ({ id: a.id }),
    );
  }

  return spec;
}

/**
 * Create a MetaAdsManager from a PlatformConnection.
 * The connection's config must contain { adAccountId: string }.
 */
export function createMetaAdsManagerFromConnection(connection: {
  accessToken: string | null;
  config: unknown;
}): MetaAdsManager {
  const config = (connection.config ?? {}) as Record<string, unknown>;
  const accessToken = connection.accessToken;
  const adAccountId = config.adAccountId as string | undefined;

  if (!accessToken) {
    throw new Error(
      "No Meta access token. Re-authenticate via Publishing > Connections.",
    );
  }
  if (!adAccountId) {
    throw new Error(
      "No ad account ID configured. Set adAccountId in the platform connection config.",
    );
  }

  return new MetaAdsManager(accessToken, adAccountId);
}
