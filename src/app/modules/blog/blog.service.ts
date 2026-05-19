import { prisma } from "../../lib/prisma";
import slugify from "slugify";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";
import { BlogStatus } from "@prisma/client";

// Generate a unique, lowercase slug from title. If duplicate exists, appends -1, -2, -3, etc.
const generateUniqueSlug = async (title: string, currentId?: string): Promise<string> => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const isExist = await prisma.blog.findFirst({
      where: {
        slug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
    });
    
    if (!isExist) {
      break;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// Create a new blog post
const createBlog = async (data: any, authorId: string) => {
  // Generate unique slug
  const slug = await generateUniqueSlug(data.title);

  // Set publishedAt if the initial status is PUBLISHED
  const publishedAt = data.status === BlogStatus.PUBLISHED ? new Date() : null;

  const blog = await prisma.blog.create({
    data: {
      ...data,
      slug,
      authorId,
      publishedAt,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return blog;
};

// Update an existing blog post
const updateBlog = async (id: string, data: any) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new AppError("Blog post not found", httpStatus.NOT_FOUND);
  }

  const updateData = { ...data };

  // If title is updated, regenerate slug
  if (data.title && data.title !== existingBlog.title) {
    updateData.slug = await generateUniqueSlug(data.title, id);
  }

  // Handle status updates and publishedAt timestamps
  if (data.status === BlogStatus.PUBLISHED && existingBlog.status !== BlogStatus.PUBLISHED) {
    updateData.publishedAt = new Date();
  } else if (data.status && data.status !== BlogStatus.PUBLISHED) {
    // Optional: reset publishedAt if draft/archived
    updateData.publishedAt = null;
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return blog;
};

// Delete a blog post
const deleteBlog = async (id: string) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new AppError("Blog post not found", httpStatus.NOT_FOUND);
  }

  await prisma.blog.delete({
    where: { id },
  });

  return true;
};

// Get a single blog post by Slug
const getBlogBySlug = async (slug: string) => {
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!blog) {
    throw new AppError("Blog post not found", httpStatus.NOT_FOUND);
  }

  return blog;
};

// Get a single blog post by ID
const getBlogById = async (id: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!blog) {
    throw new AppError("Blog post not found", httpStatus.NOT_FOUND);
  }

  return blog;
};

// Admin List View: Support searching, status filtering, category filtering, sorting, and pagination
const getAdminBlogs = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
  searchTerm?: string,
) => {
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  const andConditions: any[] = [];

  // Exact matches for fields like status, category, isFeatured
  if (cleanFilter.status) {
    andConditions.push({ status: cleanFilter.status });
  }

  if (cleanFilter.category) {
    andConditions.push({
      category: {
        equals: cleanFilter.category,
        mode: "insensitive",
      },
    });
  }

  if (cleanFilter.isFeatured !== undefined) {
    andConditions.push({
      isFeatured: cleanFilter.isFeatured === "true" || cleanFilter.isFeatured === true,
    });
  }

  // Full-text search on title or content
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [blogs, total] = await prisma.$transaction([
    prisma.blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    blogs,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Public List View: Only shows PUBLISHED blogs, supports search, category filter, isFeatured filter, pagination, and sorting
const getPublicBlogs = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
  searchTerm?: string,
) => {
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  // Enforce only PUBLISHED blogs for public requests
  const andConditions: any[] = [{ status: BlogStatus.PUBLISHED }];

  if (cleanFilter.category) {
    andConditions.push({
      category: {
        equals: cleanFilter.category,
        mode: "insensitive",
      },
    });
  }

  if (cleanFilter.isFeatured !== undefined) {
    andConditions.push({
      isFeatured: cleanFilter.isFeatured === "true" || cleanFilter.isFeatured === true,
    });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const where = { AND: andConditions };

  const [blogs, total] = await prisma.$transaction([
    prisma.blog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    blogs,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Fetch list of unique blog categories and tags currently used in the DB
const getCategoriesAndTags = async () => {
  const blogs = await prisma.blog.findMany({
    select: {
      category: true,
      tags: true,
    },
  });

  const categories = Array.from(
    new Set(blogs.map((b) => b.category).filter(Boolean)),
  );
  
  const allTags = blogs.flatMap((b) => b.tags || []);
  const tags = Array.from(new Set(allTags.filter(Boolean)));

  return { categories, tags };
};

export const blogService = {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogBySlug,
  getBlogById,
  getAdminBlogs,
  getPublicBlogs,
  getCategoriesAndTags,
};
