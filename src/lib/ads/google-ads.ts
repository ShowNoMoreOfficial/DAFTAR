/**
 * Google Ads Manager — YouTube video ads + Search campaign management.
 *
 * Uses the community-maintained `google-ads-api` package (gRPC/protobuf).
 *
 * Requires:
 *   GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
 *   GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID
 *
 *   OR a PlatformConnection with platform="google_ads" containing
 *   config.googleAdsCustomerId + refreshToken.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GoogleAdsApi, enums } from "google-ads-api";

// ─── Types ──────────────────────────────────────────────

export type GoogleAdsCampaignType = "YOUTUBE" | "SEARCH";

export interface GoogleAdsCampaignConfig {
  name: string;
  type: GoogleAdsCampaignType;
  dailyBudgetMicros: number; // 1 INR = 1_000_000 micros
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  status?: "PAUSED" | "ENABLED";
  // YouTube-specific
  videoId?: string;
  // Search-specific
  keywords?: string[];
  // Targeting
  targeting?: GoogleAdsTargeting;
}

export interface GoogleAdsTargeting {
  locations?: string[]; // geo target constant resource names
  ageRanges?: string[];
  genders?: string[];
  keywords?: string[];
  topics?: string[];
  youtubeChannels?: string[];
}

export interface GoogleAdsCampaignSummary {
  id: string;
  name: string;
  status: string;
  type: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
}

export interface GoogleAdsCampaignInsights {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
}

// ─── Manager Class ──────────────────────────────────────

export class GoogleAdsManager {
  private client: GoogleAdsApi;
  private customerId: string;
  private refreshToken: string;
  private loginCustomerId?: string;

  constructor(config?: {
    clientId?: string;
    clientSecret?: string;
    developerToken?: string;
    refreshToken?: string;
    customerId?: string;
    loginCustomerId?: string;
  }) {
    this.client = new GoogleAdsApi({
      client_id: config?.clientId ?? process.env.GOOGLE_ADS_CLIENT_ID ?? "",
      client_secret: config?.clientSecret ?? process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
      developer_token: config?.developerToken ?? process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
    });

    this.customerId = (config?.customerId ?? process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").replace(/-/g, "");
    this.refreshToken = config?.refreshToken ?? process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "";
    this.loginCustomerId = config?.loginCustomerId ?? process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? undefined;
  }

  private getCustomer() {
    return this.client.Customer({
      customer_id: this.customerId,
      refresh_token: this.refreshToken,
      login_customer_id: this.loginCustomerId,
    });
  }

  // ─── Campaigns ──────────────────────────────────────

  async createYouTubeAdCampaign(config: GoogleAdsCampaignConfig): Promise<string> {
    const customer = this.getCustomer();

    // Create budget + campaign + ad group in a single mutate
    const budgetResourceName = `customers/${this.customerId}/campaignBudgets/-1`;

    const results = await customer.mutateResources([
      // 1. Campaign Budget
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          name: `${config.name} — Budget`,
          amount_micros: config.dailyBudgetMicros,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        },
      },
      // 2. Campaign (VIDEO type)
      {
        entity: "campaign",
        operation: "create",
        resource: {
          name: config.name,
          advertising_channel_type: enums.AdvertisingChannelType.VIDEO,
          status: config.status === "ENABLED"
            ? enums.CampaignStatus.ENABLED
            : enums.CampaignStatus.PAUSED,
          campaign_budget: budgetResourceName,
          start_date: config.startDate.replace(/-/g, ""),
          end_date: config.endDate?.replace(/-/g, "") || undefined,
          bidding_strategy_type: enums.BiddingStrategyType.MAXIMIZE_CONVERSIONS,
        },
      },
    ]);

    // Extract the campaign resource name from results
    const responses = (results as any).mutate_operation_responses ?? [];
    const campaignResult = responses[1]?.campaign_result;
    const resourceName = campaignResult?.resource_name ?? "";
    const campaignId = resourceName.split("/").pop() ?? "";

    return campaignId;
  }

  async createSearchCampaign(config: GoogleAdsCampaignConfig): Promise<string> {
    const customer = this.getCustomer();

    const budgetResourceName = `customers/${this.customerId}/campaignBudgets/-2`;

    const results = await customer.mutateResources([
      // 1. Campaign Budget
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          name: `${config.name} — Budget`,
          amount_micros: config.dailyBudgetMicros,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        },
      },
      // 2. Campaign (SEARCH type)
      {
        entity: "campaign",
        operation: "create",
        resource: {
          name: config.name,
          advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
          status: config.status === "ENABLED"
            ? enums.CampaignStatus.ENABLED
            : enums.CampaignStatus.PAUSED,
          campaign_budget: budgetResourceName,
          start_date: config.startDate.replace(/-/g, ""),
          end_date: config.endDate?.replace(/-/g, "") || undefined,
          bidding_strategy_type: enums.BiddingStrategyType.TARGET_SPEND,
          network_settings: {
            target_google_search: true,
            target_search_network: true,
            target_content_network: false,
          },
        },
      },
    ]);

    const responses = (results as any).mutate_operation_responses ?? [];
    const campaignResult = responses[1]?.campaign_result;
    const resourceName = campaignResult?.resource_name ?? "";
    const campaignId = resourceName.split("/").pop() ?? "";

    return campaignId;
  }

  async getCampaigns(): Promise<GoogleAdsCampaignSummary[]> {
    const customer = this.getCustomer();

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.video_views,
        metrics.video_view_rate,
        metrics.average_cpv
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.id
    `);

    return rows.map((row: any) => ({
      id: String(row.campaign?.id ?? ""),
      name: row.campaign?.name ?? "",
      status: row.campaign?.status ?? "",
      type: row.campaign?.advertising_channel_type ?? "",
      impressions: Number(row.metrics?.impressions ?? 0),
      clicks: Number(row.metrics?.clicks ?? 0),
      costMicros: Number(row.metrics?.cost_micros ?? 0),
      conversions: Number(row.metrics?.conversions ?? 0),
      ctr: Number(row.metrics?.ctr ?? 0),
      averageCpc: Number(row.metrics?.average_cpc ?? 0),
      videoViews: Number(row.metrics?.video_views ?? 0),
      videoViewRate: Number(row.metrics?.video_view_rate ?? 0),
      averageCpv: Number(row.metrics?.average_cpv ?? 0),
    }));
  }

  async getCampaignPerformance(
    campaignId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<GoogleAdsCampaignInsights[]> {
    const customer = this.getCustomer();

    const start = startDate ?? getDateNDaysAgo(7);
    const end = endDate ?? getToday();

    const rows = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.video_views,
        metrics.video_view_rate,
        metrics.average_cpv
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${start}' AND '${end}'
      ORDER BY segments.date
    `);

    return rows.map((row: any) => ({
      campaignId: String(row.campaign?.id ?? ""),
      campaignName: row.campaign?.name ?? "",
      date: row.segments?.date ?? "",
      impressions: Number(row.metrics?.impressions ?? 0),
      clicks: Number(row.metrics?.clicks ?? 0),
      costMicros: Number(row.metrics?.cost_micros ?? 0),
      conversions: Number(row.metrics?.conversions ?? 0),
      ctr: Number(row.metrics?.ctr ?? 0),
      averageCpc: Number(row.metrics?.average_cpc ?? 0),
      videoViews: Number(row.metrics?.video_views ?? 0),
      videoViewRate: Number(row.metrics?.video_view_rate ?? 0),
      averageCpv: Number(row.metrics?.average_cpv ?? 0),
    }));
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const customer = this.getCustomer();
    await customer.mutateResources([
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
          status: enums.CampaignStatus.PAUSED,
        },
      },
    ]);
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    const customer = this.getCustomer();
    await customer.mutateResources([
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
          status: enums.CampaignStatus.ENABLED,
        },
      },
    ]);
  }

  async updateCampaignBudget(campaignId: string, newBudgetMicros: number): Promise<void> {
    const customer = this.getCustomer();

    // First, find the campaign's budget resource
    const rows = await customer.query(`
      SELECT campaign.campaign_budget
      FROM campaign
      WHERE campaign.id = ${campaignId}
    `);

    const budgetResource = (rows[0] as any)?.campaign?.campaign_budget;
    if (!budgetResource) throw new Error("Campaign budget not found");

    await customer.mutateResources([
      {
        entity: "campaign_budget",
        operation: "update",
        resource: {
          resource_name: budgetResource,
          amount_micros: newBudgetMicros,
        },
      },
    ]);
  }
}

// ─── Helpers ────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/**
 * Create a GoogleAdsManager from a PlatformConnection.
 * The connection's config must contain { googleAdsCustomerId: string }.
 */
export function createGoogleAdsManagerFromConnection(connection: {
  accessToken: string | null;
  refreshToken: string | null;
  config: unknown;
}): GoogleAdsManager {
  const config = (connection.config ?? {}) as Record<string, unknown>;
  const customerId = config.googleAdsCustomerId as string | undefined;

  if (!customerId) {
    throw new Error(
      "No Google Ads Customer ID configured. Set googleAdsCustomerId in the platform connection config.",
    );
  }

  return new GoogleAdsManager({
    refreshToken: connection.refreshToken ?? undefined,
    customerId,
  });
}
