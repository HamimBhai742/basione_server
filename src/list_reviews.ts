import { prisma } from "./app/lib/prisma";

async function main() {
  try {
    const reviews = await prisma.templateReview.findMany({
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        },
        template: {
          select: {
            headline: true,
          }
        }
      }
    });
    console.log("Total reviews in DB:", reviews.length);
    console.log(JSON.stringify(reviews, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
