declare module "facebook-nodejs-business-sdk" {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Fields = string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Params = Record<string, any>;

  export class AdAccount {
    constructor(id: string);
    get(fields: Fields, params?: Params): Promise<any>;
    getInsights(fields: Fields, params?: Params): Promise<any[]>;
    getCampaigns(fields: Fields, params?: Params): Promise<any[]>;
    createCampaign(fields: Fields, params: Params): Promise<any>;
    createAdSet(fields: Fields, params: Params): Promise<any>;
    createAdCreative(fields: Fields, params: Params): Promise<any>;
    createAd(fields: Fields, params: Params): Promise<any>;
  }

  export class Campaign {
    constructor(id: string);
    get(fields: Fields, params?: Params): Promise<any>;
    update(fields: Fields, params: Params): Promise<any>;
    getInsights(fields: Fields, params?: Params): Promise<any[]>;
    getAdSets(fields: Fields, params?: Params): Promise<any[]>;
  }

  export class AdSet {
    constructor(id: string);
    get(fields: Fields, params?: Params): Promise<any>;
    update(fields: Fields, params: Params): Promise<any>;
  }

  export class Ad {
    constructor(id: string);
    get(fields: Fields, params?: Params): Promise<any>;
  }

  export class AdCreative {
    constructor(id: string);
    get(fields: Fields, params?: Params): Promise<any>;
  }

  export class AdImage {
    constructor(id: string);
  }

  export class CustomAudience {
    constructor(id: string);
  }

  const _default: {
    FacebookAdsApi: typeof FacebookAdsApi;
    AdAccount: typeof AdAccount;
    Campaign: typeof Campaign;
    AdSet: typeof AdSet;
    Ad: typeof Ad;
    AdCreative: typeof AdCreative;
    AdImage: typeof AdImage;
    CustomAudience: typeof CustomAudience;
  };

  export default _default;
}
