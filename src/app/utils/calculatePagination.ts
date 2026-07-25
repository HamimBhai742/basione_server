export interface IOptionsResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}

interface IOptions {
  page?: number | string;
  limit?: number | string;
  sortOrder?: string;
  sortBy?: string;
  sort?: string;
  order?: string;
  dir?: string;
}

export const calculatePagination = (options: IOptions = {}): IOptionsResult => {
  const page: number = Math.max(1, Number(options?.page) || 1);
  const limit: number = Math.max(1, Number(options?.limit) || 10);
  const skip: number = (page - 1) * limit;

  let sortBy: string = options?.sortBy || options?.sort || "createdAt";
  if (sortBy === "asc" || sortBy === "desc") {
    sortBy = "createdAt";
  }

  let rawOrder = options?.sortOrder || options?.order || options?.dir;
  if (!rawOrder && typeof options?.sort === "string") {
    const s = options.sort.toLowerCase();
    if (s === "asc" || s === "desc") {
      rawOrder = s;
    }
  }

  const sortOrder: string =
    typeof rawOrder === "string" && rawOrder.toLowerCase() === "asc"
      ? "asc"
      : "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};
