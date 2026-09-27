export interface IPricingSetting {
  id?: string;
  baseBannerPrice: number;
  pricePerM2Under1: number;
  pricePerM2From1: number;
  eyeletsFee: number;
  standardPrice60x40?: number;
  standardPrice120x80?: number;
  standardPrice180x120?: number;
  standardPrice240x160?: number;
  standardDeliveryFee: number;
  expressDeliveryFee: number;
  standardPickupFee: number;
  expressPickupFee: number;
}
