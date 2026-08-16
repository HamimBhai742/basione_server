import { prisma } from "../app/lib/prisma";

async function main() {
  const allTuinposters = await prisma.banner.findMany({
    where: {
      isReadymade: true
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      isTemplate: true,
      isReadymade: true,
      imageUrl: true,
      mockupUrl: true,
      userId: true,
      sourceTemplateId: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const nullTuinposters = allTuinposters.filter(item => !item.mockupUrl);
  const nullTemplates = nullTuinposters.filter(item => item.isTemplate);

  console.log("==========================================");
  console.log(`Found ${nullTuinposters.length} total Tuinposters with NULL/Empty Mockup.`);
  console.log(`Of those, ${nullTemplates.length} are actual templates (isTemplate: true).`);
  if (nullTemplates.length > 0) {
    console.log(JSON.stringify(nullTemplates, null, 2));
  }
  console.log("==========================================");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
