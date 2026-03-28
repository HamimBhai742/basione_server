import { prisma } from "../../lib/prisma";


 const createDesign = async (userId: string, payload: any) => {
    const design = await prisma.design.create({
        data: {
            ...payload,
            userId,
        },
    });
    return design;
 }

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
    createDesign
};
