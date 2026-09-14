import * as Types from '@/indexer/__generated__/operations';

import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
export const ExtrinsicFragmentDoc = gql`
    fragment Extrinsic on Extrinsic {
  hash
  block {
    height
    timestamp
  }
  indexInBlock
  success
  error
}
    `;
export const ExtrinsicByHashDocument = gql`
    query ExtrinsicByHash($hash: String!) {
  extrinsics(where: {hash_eq: $hash}) {
    ...Extrinsic
  }
}
    ${ExtrinsicFragmentDoc}`;
export const ExtrinsicByBlockAndIndexDocument = gql`
    query ExtrinsicByBlockAndIndex($blockNumber: Int!, $index: Int!) {
  extrinsics(where: {block: {height_eq: $blockNumber}, indexInBlock_eq: $index}) {
    ...Extrinsic
  }
}
    ${ExtrinsicFragmentDoc}`;
export const YieldFarmCreatedDocument = gql`
    query YieldFarmCreated($blockNumber: Int!) {
  events(
    where: {name_eq: "OmnipoolLiquidityMining.YieldFarmCreated", block: {height_gte: $blockNumber}}
    orderBy: [block_height_ASC]
  ) {
    args
  }
}
    `;
export const OtcOrderStatusDocument = gql`
    query OtcOrderStatus($orderId: Int!) {
  events(
    where: {args_jsonContains: {orderId: $orderId}, AND: {name_eq: "OTC.Placed"}}
  ) {
    args
  }
}
    `;
export const AccumulatedRpsUpdatedEventsDocument = gql`
    query AccumulatedRpsUpdatedEvents {
  events(
    where: {name_eq: "Staking.AccumulatedRpsUpdated"}
    orderBy: [block_height_ASC]
  ) {
    args
    block {
      height
    }
    name
  }
}
    `;
export const StakingInitializedEventsDocument = gql`
    query StakingInitializedEvents {
  events(where: {name_eq: "Staking.StakingInitialized"}) {
    block {
      height
    }
    name
  }
}
    `;
export const ScheduledOrdersDocument = gql`
    query ScheduledOrders($who: String!) {
  events(
    where: {args_jsonContains: {who: $who}, AND: {name_eq: "DCA.Scheduled"}}
    orderBy: [block_height_DESC]
    limit: 100
  ) {
    name
    args
    call {
      args
    }
    block {
      height
      hash
      timestamp
    }
  }
}
    `;
export const OrdersStatusDocument = gql`
    query OrdersStatus($who: String!) {
  events(
    where: {args_jsonContains: {who: $who}, AND: {name_in: ["DCA.Terminated", "DCA.Completed", "DCA.MigrationCancelled"]}}
    orderBy: [block_height_DESC]
    limit: 100
  ) {
    name
    args
  }
}
    `;
export const MigratedOrdersDocument = gql`
    query MigratedOrders($who: String!) {
  events(
    where: {args_jsonContains: {who: $who}, AND: {name_eq: "DCA.Migrated"}}
    orderBy: [block_height_DESC]
    limit: 100
  ) {
    name
    args
    block {
      height
      hash
      timestamp
    }
  }
}
    `;
export const OrderTradesDocument = gql`
    query OrderTrades($id: Int!) {
  events(
    where: {args_jsonContains: {id: $id}, AND: {name_in: ["DCA.TradeExecuted", "DCA.TradeFailed"]}}
    orderBy: [block_height_DESC]
    limit: 100
  ) {
    name
    args
    block {
      height
      timestamp
    }
  }
}
    `;
export const IntentsSubmittedDocument = gql`
    query IntentsSubmitted($owner: String!, $limit: Int!, $offset: Int!) {
  events(
    where: {args_jsonContains: {owner: $owner}, AND: {name_eq: "Intent.IntentSubmitted"}}
    orderBy: [block_height_DESC]
    limit: $limit
    offset: $offset
  ) {
    name
    args
    block {
      height
      hash
      timestamp
    }
  }
}
    `;
export const IntentEventsDocument = gql`
    query IntentEvents($idFilters: [EventWhereInput!]!) {
  events(
    where: {AND: [{name_in: ["Intent.IntentResolved", "Intent.IntentResovedPartially", "Intent.IntentCanceled", "Intent.IntentExpired", "Intent.DcaTradeExecuted", "Intent.DcaCompleted"]}, {OR: $idFilters}]}
    orderBy: [block_height_DESC]
    limit: 1000
  ) {
    name
    args
    block {
      height
      hash
      timestamp
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    ExtrinsicByHash(variables: Types.ExtrinsicByHashQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.ExtrinsicByHashQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.ExtrinsicByHashQuery>({ document: ExtrinsicByHashDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ExtrinsicByHash', 'query', variables);
    },
    ExtrinsicByBlockAndIndex(variables: Types.ExtrinsicByBlockAndIndexQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.ExtrinsicByBlockAndIndexQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.ExtrinsicByBlockAndIndexQuery>({ document: ExtrinsicByBlockAndIndexDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ExtrinsicByBlockAndIndex', 'query', variables);
    },
    YieldFarmCreated(variables: Types.YieldFarmCreatedQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.YieldFarmCreatedQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.YieldFarmCreatedQuery>({ document: YieldFarmCreatedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'YieldFarmCreated', 'query', variables);
    },
    OtcOrderStatus(variables: Types.OtcOrderStatusQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.OtcOrderStatusQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.OtcOrderStatusQuery>({ document: OtcOrderStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'OtcOrderStatus', 'query', variables);
    },
    AccumulatedRpsUpdatedEvents(variables?: Types.AccumulatedRpsUpdatedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.AccumulatedRpsUpdatedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.AccumulatedRpsUpdatedEventsQuery>({ document: AccumulatedRpsUpdatedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AccumulatedRpsUpdatedEvents', 'query', variables);
    },
    StakingInitializedEvents(variables?: Types.StakingInitializedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.StakingInitializedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.StakingInitializedEventsQuery>({ document: StakingInitializedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'StakingInitializedEvents', 'query', variables);
    },
    ScheduledOrders(variables: Types.ScheduledOrdersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.ScheduledOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.ScheduledOrdersQuery>({ document: ScheduledOrdersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ScheduledOrders', 'query', variables);
    },
    OrdersStatus(variables: Types.OrdersStatusQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.OrdersStatusQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.OrdersStatusQuery>({ document: OrdersStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'OrdersStatus', 'query', variables);
    },
    MigratedOrders(variables: Types.MigratedOrdersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.MigratedOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.MigratedOrdersQuery>({ document: MigratedOrdersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MigratedOrders', 'query', variables);
    },
    OrderTrades(variables: Types.OrderTradesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.OrderTradesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.OrderTradesQuery>({ document: OrderTradesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'OrderTrades', 'query', variables);
    },
    IntentsSubmitted(variables: Types.IntentsSubmittedQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.IntentsSubmittedQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.IntentsSubmittedQuery>({ document: IntentsSubmittedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'IntentsSubmitted', 'query', variables);
    },
    IntentEvents(variables: Types.IntentEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<Types.IntentEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.IntentEventsQuery>({ document: IntentEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'IntentEvents', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;