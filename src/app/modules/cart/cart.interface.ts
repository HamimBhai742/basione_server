export interface ICartItemPayload {
  bannerId: string;
  quantity: number;
  hasEyelets?: boolean;
}

export interface ISyncCartPayload {
  items: ICartItemPayload[];
}
