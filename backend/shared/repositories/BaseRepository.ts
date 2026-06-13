// Sahi path for modern Mongoose (v6/v7+)
import { FilterQuery, UpdateQuery, QueryOptions, ProjectionType,Document,Model } from 'mongoose';
// ============================================================
// Generic Repository Interface
// Defines the contract every repository must fulfil
// ============================================================
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findMany(
    filter: FilterQuery<T>,
    options?: QueryOptions,
    projection?: ProjectionType<T>
  ): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  updateById(id: string, update: UpdateQuery<T>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}

// ============================================================
// Base Repository — concrete generic implementation
// Extend this class in every domain repository
// ============================================================
export abstract class BaseRepository<T extends Document>
  implements IRepository<T>
{
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean<T>().exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean<T>().exec();
  }

  async findMany(
    filter: FilterQuery<T> = {},
    options: QueryOptions = {},
    projection?: ProjectionType<T>
  ): Promise<T[]> {
    const query = this.model.find(filter, projection);

    if (options.sort) query.sort(options.sort);
    if (options.skip) query.skip(options.skip as number);
    if (options.limit) query.limit(options.limit as number);
    if (options.select) query.select(options.select);

    return query.lean<T[]>().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return (await doc.save()) as T;
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean<T>()
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    return this.model.exists(filter).then((r) => r !== null);
  }

  /**
   * Paginate helper — returns items + total count in one call
   */
  async paginate(
    filter: FilterQuery<T>,
    page: number,
    limit: number,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ items: T[]; total: number; page: number; hasNext: boolean }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean<T[]>().exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total, page, hasNext: skip + items.length < total };
  }
}
