import { prisma } from "../../lib/prisma";

const getAlertBarSetting = async () => {
  let setting = await (prisma as any).alertBarSetting.findFirst();
  
  if (!setting) {
    setting = await (prisma as any).alertBarSetting.create({
      data: {
        isEnabled: false,
        message: "",
      },
    });
  }
  
  return setting;
};

const updateAlertBarSetting = async (payload: { isEnabled?: boolean; message?: string }) => {
  let setting = await (prisma as any).alertBarSetting.findFirst();
  
  if (!setting) {
    return (prisma as any).alertBarSetting.create({
      data: {
        isEnabled: payload.isEnabled ?? false,
        message: payload.message ?? "",
      },
    });
  }
  
  return (prisma as any).alertBarSetting.update({
    where: {
      id: setting.id,
    },
    data: {
      isEnabled: payload.isEnabled !== undefined ? payload.isEnabled : setting.isEnabled,
      message: payload.message !== undefined ? payload.message : setting.message,
    },
  });
};

export const alertBarService = {
  getAlertBarSetting,
  updateAlertBarSetting,
};
