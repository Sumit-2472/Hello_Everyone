import { FilterQuery } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { ProductModel, IProduct } from '../models/Product.model';
import { ProductCategory } from '../../../shared/types/enums';

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(ProductModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findBySku(sku: string): Promise<IProduct | null> {
    return ProductModel.findOne({ sku: sku.toUpperCase() }).exec();
  }

  async findByCategory(category: ProductCategory, activeOnly = true): Promise<IProduct[]> {
    const filter: FilterQuery<IProduct> = { category };
    if (activeOnly) filter.isActive = true;
    return ProductModel.find(filter).sort({ name: 1 }).lean<IProduct[]>().exec();
  }

  /** Full-text search against name, brand, description */
  async search(query: string, limit = 20): Promise<IProduct[]> {
    return ProductModel.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean<IProduct[]>()
      .exec();
  }

  /** Atomically increment return stats and recalculate return rate */
  async recordReturn(productId: string): Promise<IProduct | null> {
    const product = await ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { totalReturned: 1 } },
      { new: true }
    ).exec();

    if (product && product.totalSold > 0) {
      const rate = (product.totalReturned / product.totalSold) * 100;
      return ProductModel.findByIdAndUpdate(
        productId,
        { returnRatePercent: parseFloat(rate.toFixed(2)) },
        { new: true }
      )
        .lean<IProduct>()
        .exec();
    }
    return product;
  }

  /** Record a sale — increments totalSold counter */
  async recordSale(productId: string): Promise<void> {
    await ProductModel.findByIdAndUpdate(productId, {
      $inc: { totalSold: 1 },
    }).exec();
  }

  /** Get high-return-risk products for prevention recommendations */
  async getHighReturnRiskProducts(threshold = 30, limit = 50): Promise<IProduct[]> {
    return ProductModel.find({
      returnRatePercent: { $gte: threshold },
      isActive: true,
    })
      .sort({ returnRatePercent: -1 })
      .limit(limit)
      .select('name category brand returnRatePercent imageUrls')
      .lean<IProduct[]>()
      .exec();
  }

  async deactivate(productId: string): Promise<void> {
    await ProductModel.findByIdAndUpdate(productId, { isActive: false }).exec();
  }
}

export const productRepository = new ProductRepository();
