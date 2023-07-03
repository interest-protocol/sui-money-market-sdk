import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import { SUI_TYPE_ARG } from '@mysten/sui.js';

export enum Network {
  DEVNET = 'sui:devnet',
  TESTNET = 'sui:testnet',
  MAINNET = 'sui:mainnet',
}

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const MONEY_MARKET_OBJECTS = {
  [Network.DEVNET]: {
    DASHBOARD_PACKAGE_ID: ZERO_ADDRESS,
    MONEY_MARKET_PACKAGE_ID: ZERO_ADDRESS,
    MONEY_MARKET_STORAGE: ZERO_ADDRESS,
    INTEREST_RATE_STORAGE: ZERO_ADDRESS,
    ORACLE_PACKAGE_ID: ZERO_ADDRESS,
    ORACLE_STORAGE: ZERO_ADDRESS,
    SUID_PACKAGE_ID: ZERO_ADDRESS,
    SUID_STORAGE: ZERO_ADDRESS,
    WORMHOLE_STATE: ZERO_ADDRESS,
    PYTH_STATE: ZERO_ADDRESS,
    IPX_STORAGE: ZERO_ADDRESS,
  },
  [Network.TESTNET]: {
    DASHBOARD_PACKAGE_ID:
      '0x4bd091284f31a1b180515ba47a711d588c22ee2d62b2082d3fd9b09a45736f78',
    MONEY_MARKET_PACKAGE_ID:
      '0xe8188db486c521ddaa41508ef64cc8626c6039f1285b16ef6837bc3ade0ff5ec',
    MONEY_MARKET_STORAGE:
      '0x35685e73c360200e259cb2cb9b79bd370341a3c0c8bacc4bc8151514a33473e2',
    INTEREST_RATE_STORAGE:
      '0xdfa7954c7c9c32e2d1d5f24529fbb860e77b82cb56b6fe3a2c1e7faf711dcd65',
    ORACLE_PACKAGE_ID:
      '0xbd5fc6e8494555f8f01e8b75e920532b560b7a71eabd439aa2d0dbeae7b81653',
    ORACLE_STORAGE:
      '0x6e69cd7dd8b19a999dc614a011cf5faac66941527b8bec131ac0175fa67240dc',
    SUID_PACKAGE_ID:
      '0x02871464ed71b80969b32f2b23c981b085866485ba5368c0f59588fcc0dbce47',
    SUID_STORAGE:
      '0x60d44e96cc24ccf72b782af4f8e5f8f43cf00803df2daadf3203270da1140bf3',
    WORMHOLE_STATE:
      '0xebba4cc4d614f7a7cdbe883acc76d1cc767922bc96778e7b68be0d15fce27c02',
    PYTH_STATE:
      '0xd8afde3a48b4ff7212bd6829a150f43f59043221200d63504d981f62bff2e27a',
    IPX_STORAGE:
      '0xbde90abe69907e9ecd4bed481c29dafd338a1121b84fecf8874e0878eaba885f',
  },
  [Network.MAINNET]: {
    DASHBOARD_PACKAGE_ID: ZERO_ADDRESS,
    MONEY_MARKET_PACKAGE_ID: ZERO_ADDRESS,
    MONEY_MARKET_STORAGE: ZERO_ADDRESS,
    INTEREST_RATE_STORAGE: ZERO_ADDRESS,
    ORACLE_PACKAGE_ID: ZERO_ADDRESS,
    ORACLE_STORAGE: ZERO_ADDRESS,
    SUID_PACKAGE_ID: ZERO_ADDRESS,
    SUID_STORAGE: ZERO_ADDRESS,
    WORMHOLE_STATE: ZERO_ADDRESS,
    PYTH_STATE: ZERO_ADDRESS,
    IPX_STORAGE: ZERO_ADDRESS,
  },
};

export const MONEY_MARKET_KEYS = {
  [Network.DEVNET]: [],
  [Network.TESTNET]: [
    '0x02871464ed71b80969b32f2b23c981b085866485ba5368c0f59588fcc0dbce47::suid::SUID',
    SUI_TYPE_ARG,
    '0xb8656a09a489819f07c444cb4a4a61a3b482a5ea994fd71b0a643ffc1c2f2dd0::ieth::IETH',
  ],
  [Network.MAINNET]: [],
} as Record<Network, ReadonlyArray<string>>;

export const MONEY_MARKET_DECIMALS = {
  [Network.DEVNET]: {},
  [Network.TESTNET]: {
    [SUI_TYPE_ARG]: 9,
    '0x02871464ed71b80969b32f2b23c981b085866485ba5368c0f59588fcc0dbce47::suid::SUID': 9,
    '0xb8656a09a489819f07c444cb4a4a61a3b482a5ea994fd71b0a643ffc1c2f2dd0::ieth::IETH': 9,
  },
  [Network.MAINNET]: {},
} as Record<Network, Record<string, number>>;

export const marketBCS = new BCS(getSuiMoveConfig());

export const MILLISECONDS_PER_YEAR = 31540000000;

marketBCS.registerStructType('Market', {
  borrow_rate: BCS.U64,
  supply_rate: BCS.U64,
  cash: BCS.U64,
  collateral_enabled: BCS.BOOL,
  allocation_points: BCS.U256,
  user_principal: BCS.U64,
  user_shares: BCS.U64,
  user_loan_pending_rewards: BCS.U256,
  user_collateral_pending_rewards: BCS.U256,
  total_collateral_elastic: BCS.U64,
  total_collateral_base: BCS.U64,
  total_loan_elastic: BCS.U64,
  total_loan_base: BCS.U64,
  borrow_cap: BCS.U64,
  collateral_cap: BCS.U64,
  ltv: BCS.U256,
  accrued_timestamp: BCS.U64,
  can_be_collateral: BCS.BOOL,
});

// https://pyth.network/developers/price-feed-ids#sui-testnet
export const PYTH_PRICE_FEED_IDS = {
  [Network.DEVNET]: [],
  [Network.TESTNET]: [
    // SUI
    '0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266',
    // ETH
    '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
  ],
  [Network.MAINNET]: [],
} as Record<Network, string[]>;

export const PYTH_PRICE_FEED_ID_TO_PRICE_INFO_OBJECT = {
  [Network.DEVNET]: {},
  [Network.TESTNET]: {
    '0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266':
      '0xe38dbe2ff3322f1500fff45d0046101f371eebce47c067c5e9233248c4878c28',
    '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6':
      '0x8deeebad0a8fb86d97e6ad396cc84639da5a52ae4bbc91c78eb7abbf3e641ed6',
  },
  [Network.MAINNET]: {},
} as Record<Network, Record<string, string>>;

export const PYTH_PRICE_CONNECT_URL = {
  [Network.DEVNET]: '',
  [Network.TESTNET]: 'https://xc-testnet.pyth.network',
  [Network.MAINNET]: 'https://xc-mainnet.pyth.network',
} as Record<Network, string>;

export const ORACLE_PRICE_COIN_NAMES = {
  [Network.DEVNET]: [],
  [Network.TESTNET]: [
    '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    'b8656a09a489819f07c444cb4a4a61a3b482a5ea994fd71b0a643ffc1c2f2dd0::ieth::IETH',
  ],
  [Network.MAINNET]: [],
} as Record<Network, string[]>;

// https://app.switchboard.xyz/sui/testnet
export const SWITCHBOARD_AGGREGATOR_IDS = {
  [Network.DEVNET]: [],
  [Network.TESTNET]: [
    // SUI
    '0x84d2b7e435d6e6a5b137bf6f78f34b2c5515ae61cd8591d5ff6cd121a21aa6b7',
    // ETH
    '0x68ed81c5dd07d12c629e5cdad291ca004a5cd3708d5659cb0b6bfe983e14778c',
  ],
  [Network.MAINNET]: [],
} as Record<Network, string[]>;

export const SUID_TYPE = {
  [Network.DEVNET]: '',
  [Network.TESTNET]:
    '0x02871464ed71b80969b32f2b23c981b085866485ba5368c0f59588fcc0dbce47::suid::SUID',
  [Network.MAINNET]: '',
};
