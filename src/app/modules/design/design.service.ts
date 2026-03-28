import { prisma } from "../../lib/prisma";

const myDesign = async (id: string) => {
    const design = await prisma.design.findMany({
        where: {
            userId: id,
        },
    });
    return design;
};

export const designService = {
    myDesign,
};
