import { u32 } from "@polkadot/types-codec";
import { useQuery } from "@tanstack/react-query";
import { useSpotPrice, useSpotPrices } from "api/spotPrice";
import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STABLECOIN_SYMBOL } from "./constants";
import { QUERY_KEYS } from "./queryKeys";
import { useAccountsBalances } from "api/accountBalances";
import { useRpcProvider } from "providers/rpcProvider";
import { useShareTokensByIds } from "api/xyk";
import { isNotNil } from "./helpers";
import { useShareOfPools } from "api/pools";
import axios from "axios";

type Props = { id: string; amount: BigNumber };

export const useDisplayValue = (props: Props) => {
  const displayAsset = useDisplayAssetStore();
  const spotPrice = useSpotPrice(props.id, displayAsset.id);

  const isLoading = spotPrice.isInitialLoading;

  const symbol = displayAsset.symbol;
  const amount = useMemo(() => {
    if (!displayAsset.id || !spotPrice.data || spotPrice.data.spotPrice.isNaN())
      return undefined;

    return props.amount.times(spotPrice.data.spotPrice);
  }, [props.amount, displayAsset, spotPrice.data]);

  return { amount, symbol, isLoading };
};

export const useDisplayPrice = (id: string | u32 | undefined) => {
  const displayAsset = useDisplayAssetStore();
  const spotPrice = useSpotPrice(id, displayAsset.id);
  const usdPrice = useCoingeckoUsdPrice();

  const isLoading = spotPrice.isInitialLoading || usdPrice.isInitialLoading;

  const data = useMemo(() => {
    if (isLoading) return undefined;

    if (displayAsset.isRealUSD && usdPrice.data)
      return spotPrice.data
        ? {
            ...spotPrice.data,
            spotPrice: spotPrice.data.spotPrice.times(usdPrice.data),
          }
        : undefined;

    return spotPrice.data;
  }, [displayAsset.isRealUSD, isLoading, spotPrice.data, usdPrice.data]);

  return { data, isLoading, isInitialLoading: isLoading };
};

//TODO: mb create a hook for a single share token
export const useDisplayShareTokenPrice = (ids: string[]) => {
  const { assets } = useRpcProvider();

  const shareTokenIds = ids
    .filter((id) => assets.isShareToken(assets.getAsset(id.toString())))
    .map((shareTokenId) => shareTokenId.toString());

  const pools = useShareTokensByIds(shareTokenIds);

  const poolsAddress = useMemo(
    () =>
      new Map(pools.data?.map((pool) => [pool.shareTokenId, pool.poolAddress])),
    [pools.data],
  );

  const poolBalances = useAccountsBalances(Array.from(poolsAddress.values()));
  const totalIssuances = useShareOfPools(shareTokenIds);

  const shareTokensTvl = useMemo(() => {
    return shareTokenIds
      .map((shareTokenId) => {
        const poolAddress = poolsAddress.get(shareTokenId);
        const poolBalance = poolBalances.data?.find(
          (poolBalance) => poolBalance.accountId === poolAddress,
        );

        const assetA = poolBalance?.balances[0];

        if (!assetA) return undefined;

        const assetABalance = assetA.data.free
          .toBigNumber()
          .shiftedBy(-assets.getAsset(assetA.id.toString()).decimals);

        const tvl = assetABalance.multipliedBy(2);

        return { spotPriceId: assetA.id.toString(), tvl, shareTokenId };
      })
      .filter(isNotNil);
  }, [assets, poolBalances.data, poolsAddress, shareTokenIds]);

  const spotPrices = useDisplayPrices(
    shareTokensTvl.map((shareTokenTvl) => shareTokenTvl.spotPriceId),
  );

  const queries = [totalIssuances, pools, poolBalances, spotPrices];
  const isLoading = queries.some((q) => q.isInitialLoading);

  const data = useMemo(() => {
    return shareTokensTvl
      .map((shareTokenTvl) => {
        const spotPrice = spotPrices.data?.find(
          (spotPrice) => spotPrice?.tokenIn === shareTokenTvl.spotPriceId,
        );

        const tvlDisplay = shareTokenTvl.tvl.multipliedBy(
          spotPrice?.spotPrice ?? 1,
        );

        const totalIssuance = totalIssuances.data?.find(
          (totalIssuance) => totalIssuance.asset === shareTokenTvl.shareTokenId,
        );

        const shareTokenMeta = assets.getAsset(shareTokenTvl.shareTokenId);

        if (!totalIssuance?.totalShare || !spotPrice?.tokenOut)
          return undefined;

        const shareTokenDisplay = tvlDisplay.div(
          totalIssuance.totalShare.shiftedBy(-shareTokenMeta.decimals),
        );

        return {
          tokenIn: shareTokenTvl.shareTokenId,
          tokenOut: spotPrice.tokenOut,
          spotPrice: shareTokenDisplay,
        };
      })
      .filter(isNotNil);
  }, [assets, shareTokensTvl, spotPrices.data, totalIssuances.data]);

  return { data, isLoading, isInitialLoading: isLoading };
};

export const useDisplayPrices = (
  ids: (string | u32)[],
  noRefresh?: boolean,
) => {
  const displayAsset = useDisplayAssetStore();
  const spotPrices = useSpotPrices(ids, displayAsset.id, noRefresh);
  const usdPrice = useCoingeckoUsdPrice();

  const isLoading =
    spotPrices.some((q) => q.isInitialLoading) || usdPrice.isInitialLoading;

  const data = useMemo(() => {
    if (isLoading) return undefined;

    if (displayAsset.isRealUSD && usdPrice.data)
      return spotPrices.map((sp) =>
        sp.data
          ? { ...sp.data, spotPrice: sp.data.spotPrice.times(usdPrice.data) }
          : undefined,
      );

    return spotPrices.map((sp) => sp.data);
  }, [displayAsset.isRealUSD, isLoading, spotPrices, usdPrice.data]);

  return { data, isLoading, isInitialLoading: isLoading };
};

type Asset = {
  id: string | undefined;
  symbol: string;
  isRealUSD: boolean;
  isStableCoin: boolean;
  isDollar?: boolean;
  stableCoinId: string | undefined;
};
export type DisplayAssetStore = Asset & {
  update: (asset: Asset) => void;
};

export const useDisplayAssetStore = create<DisplayAssetStore>()(
  persist(
    (set) => ({
      id: undefined,
      stableCoinId: undefined,
      symbol: "$",
      isDollar: true,
      isRealUSD: false,
      isStableCoin: true,
      update: (value) =>
        set({ ...value, isDollar: value.isRealUSD || value.isStableCoin }),
    }),
    { name: "hdx-display-asset", version: 1 },
  ),
);

export const useCoingeckoUsdPrice = () => {
  const displayAsset = useDisplayAssetStore();

  return useQuery(QUERY_KEYS.coingeckoUsd, getCoingeckoSpotPrice, {
    enabled: displayAsset.isRealUSD,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    staleTime: 1000 * 60 * 60 * 24, // 24h
  });
};

//TODO: Get coingecko over the edge
export const getCoingeckoSpotPrice = async () => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${STABLECOIN_SYMBOL.toLowerCase()}&vs_currencies=usd`,
  );
  const json = await res.json();
  return json[STABLECOIN_SYMBOL.toLowerCase()].usd;
};

export const getCoinGeckoPairSpotPrice = async (
  assetName1: string,
  assetName2: string,
) => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${assetName1.toLowerCase()},${assetName2.toLowerCase()}&vs_currencies=usd`);
    const priceData = response.data;

    const priceAsset1 = priceData[assetName1]?.usd;
    const priceAsset2 = priceData[assetName2]?.usd;
    if (priceAsset1 && priceAsset2) {
      return priceAsset1 / priceAsset2;
    } else {

      return 0; // Handle the case where price data is not available
    }
  } catch (error) {
    console.error("Error fetching estimated price from CoinGecko API:", error);
    return 0; // Handle the error case
  }
};
