export interface ListPendingRequest {
  method: 'internal_listPendingRequests'
}

export type RequestMethods = ListPendingRequest['method']
