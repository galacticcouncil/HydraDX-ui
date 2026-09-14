import * as Types from '@/indexer/__generated__/types';

export type ExtrinsicFragment = { __typename?: 'Extrinsic', hash: string, indexInBlock: number, success: boolean, error?: any | null, block: { __typename?: 'Block', height: number, timestamp: string } };

export type ExtrinsicByHashQueryVariables = Types.Exact<{
  hash: Types.Scalars['String']['input'];
}>;


export type ExtrinsicByHashQuery = { __typename?: 'Query', extrinsics: Array<{ __typename?: 'Extrinsic', hash: string, indexInBlock: number, success: boolean, error?: any | null, block: { __typename?: 'Block', height: number, timestamp: string } }> };

export type ExtrinsicByBlockAndIndexQueryVariables = Types.Exact<{
  blockNumber: Types.Scalars['Int']['input'];
  index: Types.Scalars['Int']['input'];
}>;


export type ExtrinsicByBlockAndIndexQuery = { __typename?: 'Query', extrinsics: Array<{ __typename?: 'Extrinsic', hash: string, indexInBlock: number, success: boolean, error?: any | null, block: { __typename?: 'Block', height: number, timestamp: string } }> };

export type YieldFarmCreatedQueryVariables = Types.Exact<{
  blockNumber: Types.Scalars['Int']['input'];
}>;


export type YieldFarmCreatedQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', args?: any | null }> };

export type OtcOrderStatusQueryVariables = Types.Exact<{
  orderId: Types.Scalars['Int']['input'];
}>;


export type OtcOrderStatusQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', args?: any | null }> };

export type AccumulatedRpsUpdatedEventsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type AccumulatedRpsUpdatedEventsQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', args?: any | null, name: string, block: { __typename?: 'Block', height: number } }> };

export type StakingInitializedEventsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type StakingInitializedEventsQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, block: { __typename?: 'Block', height: number } }> };

export type ScheduledOrdersQueryVariables = Types.Exact<{
  who: Types.Scalars['String']['input'];
}>;


export type ScheduledOrdersQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null, call?: { __typename?: 'Call', args?: any | null } | null, block: { __typename?: 'Block', height: number, hash: string, timestamp: string } }> };

export type OrdersStatusQueryVariables = Types.Exact<{
  who: Types.Scalars['String']['input'];
}>;


export type OrdersStatusQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null }> };

export type MigratedOrdersQueryVariables = Types.Exact<{
  who: Types.Scalars['String']['input'];
}>;


export type MigratedOrdersQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null, block: { __typename?: 'Block', height: number, hash: string, timestamp: string } }> };

export type OrderTradesQueryVariables = Types.Exact<{
  id: Types.Scalars['Int']['input'];
}>;


export type OrderTradesQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null, block: { __typename?: 'Block', height: number, timestamp: string } }> };

export type IntentsSubmittedQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  limit: Types.Scalars['Int']['input'];
  offset: Types.Scalars['Int']['input'];
}>;


export type IntentsSubmittedQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null, block: { __typename?: 'Block', height: number, hash: string, timestamp: string } }> };

export type IntentEventsQueryVariables = Types.Exact<{
  idFilters: Array<Types.EventWhereInput> | Types.EventWhereInput;
}>;


export type IntentEventsQuery = { __typename?: 'Query', events: Array<{ __typename?: 'Event', name: string, args?: any | null, block: { __typename?: 'Block', height: number, hash: string, timestamp: string } }> };
