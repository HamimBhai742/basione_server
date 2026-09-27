import { prisma } from "../../lib/prisma";

export const DEFAULT_PRICING_SETTING = {
  baseBannerPrice: 11.95,
  pricePerM2Under1: 25.0,
  pricePerM2From1: 20.0,
  eyeletsFee: 3.5,
  standardPrice60x40: 11.95,
  standardPrice120x80: 24.0,
  standardPrice180x120: 43.2,
  standardPrice240x160: 76.8,
  standardDeliveryFee: 4.95,
  expressDeliveryFee: 14.95,
  standardPickupFee: 0.0,
  expressPickupFee: 14.95,
};

const getPricingSetting = async () => {
  let setting = await (prisma as any).pricingSetting.findFirst();

  if (!setting) {
    setting = await (prisma as any).pricingSetting.create({
      data: DEFAULT_PRICING_SETTING,
    });
  }

  return {
    ...DEFAULT_PRICING_SETTING,
    ...setting,
  };
};

const updatePricingSetting = async (payload: Partial<typeof DEFAULT_PRICING_SETTING>) => {
  let setting = await (prisma as any).pricingSetting.findFirst();

  const updateData: any = {};
  if (payload.baseBannerPrice !== undefined) updateData.baseBannerPrice = Number(payload.baseBannerPrice);
  if (payload.pricePerM2Under1 !== undefined) updateData.pricePerM2Under1 = Number(payload.pricePerM2Under1);
  if (payload.pricePerM2From1 !== undefined) updateData.pricePerM2From1 = Number(payload.pricePerM2From1);
  if (payload.eyeletsFee !== undefined) updateData.eyeletsFee = Number(payload.eyeletsFee);
  if (payload.standardPrice60x40 !== undefined) updateData.standardPrice60x40 = Number(payload.standardPrice60x40);
  if (payload.standardPrice120x80 !== undefined) updateData.standardPrice120x80 = Number(payload.standardPrice120x80);
  if (payload.standardPrice180x120 !== undefined) updateData.standardPrice180x120 = Number(payload.standardPrice180x120);
  if (payload.standardPrice240x160 !== undefined) updateData.standardPrice240x160 = Number(payload.standardPrice240x160);
  if (payload.standardDeliveryFee !== undefined) updateData.standardDeliveryFee = Number(payload.standardDeliveryFee);
  if (payload.expressDeliveryFee !== undefined) updateData.expressDeliveryFee = Number(payload.expressDeliveryFee);
  if (payload.standardPickupFee !== undefined) updateData.standardPickupFee = Number(payload.standardPickupFee);
  if (payload.expressPickupFee !== undefined) updateData.expressPickupFee = Number(payload.expressPickupFee);

  if (!setting) {
    return (prisma as any).pricingSetting.create({
      data: {
        ...DEFAULT_PRICING_SETTING,
        ...updateData,
      },
    });
  }

  return (prisma as any).pricingSetting.update({
    where: {
      id: setting.id,
    },
    data: updateData,
  });
};

export const pricingSettingService = {
  getPricingSetting,
  updatePricingSetting,
};
