import mongoose from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { ListingModel, IMarketplaceListing } from '../models/Listing.model';
import { ListingStatus, ProductCategory } from '../../../shared/types/enums';

interface ListingFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minHealthScore?: number;
  brand?: string;
  searchText?: string;
}

interface SortOption {
  field: 'sellingPrice' | 'trustCard.healthScore' | 'createdAt' | 'viewCount';
  direction: 1 | -1;
}

export class ListingRepository extends BaseRepository<IMarketplaceListing> {
  constructor() {
    super(ListingModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findByPassport(passportId: string): Promise<IMarketplaceListing | null> {
    return ListingModel.findOne({
      passportId: new mongoose.Types.ObjectId(passportId),
    })
      .lean<IMarketplaceListing>()
      .exec();
  }

  async findBySeller(sellerId: string, page = 1, limit = 20) {
    return this.paginate(
      { sellerId } as any,
      page,
      limit,
      { createdAt: -1 }
    );
  }

  /**
   * Marketplace search with all filters and pagination.
   * Supports: category, price range, health score, brand, full-text.
   */
  async searchListings(
    filters: ListingFilters,
    sort: SortOption = { field: 'createdAt', direction: -1 },
    page = 1,
    limit = 20
  ) {
    const query: Record<string, unknown> = { status: ListingStatus.Active };

    if (filters.category)       query.category = filters.category;
    if (filters.brand)          query.brand = new RegExp(filters.brand, 'i');
    if (filters.minHealthScore) query['trustCard.healthScore'] = { $gte: filters.minHealthScore };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice !== undefined) priceFilter.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceFilter.$lte = filters.maxPrice;
      query.sellingPrice = priceFilter;
    }

    if (filters.searchText) {
      query.$text = { $search: filters.searchText };
    }

    return this.paginate(
      query as any,
      page,
      limit,
      { [sort.field]: sort.direction } as Record<string, 1 | -1>
    );
  }

  /** Increment view count atomically */
  async incrementViews(listingId: string): Promise<void> {
    await ListingModel.findByIdAndUpdate(listingId, {
      $inc: { viewCount: 1 },
    }).exec();
  }

  /** Mark as sold and record buyer + timestamp */
  async markSold(
    listingId: string,
    buyerId: string
  ): Promise<IMarketplaceListing | null> {
    return ListingModel.findByIdAndUpdate(
      listingId,
      {
        $set: {
          status: ListingStatus.Sold,
          buyerId,
          soldAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    )
      .lean<IMarketplaceListing>()
      .exec();
  }

  /** Get similar listings for recommendation engine */
  async findSimilar(
    listing: IMarketplaceListing,
    limit = 6
  ): Promise<IMarketplaceListing[]> {
    return ListingModel.find({
      _id:      { $ne: listing._id },
      category: listing.category,
      status:   ListingStatus.Active,
      sellingPrice: {
        $gte: listing.sellingPrice * 0.7,
        $lte: listing.sellingPrice * 1.3,
      },
    })
      .sort({ 'trustCard.healthScore': -1 })
      .limit(limit)
      .lean<IMarketplaceListing[]>()
      .exec();
  }

  /** Analytics: total sales value in period */
  async getTotalSalesValue(from: Date, to: Date): Promise<number> {
    const result = await ListingModel.aggregate([
      {
        $match: {
          status: ListingStatus.Sold,
          soldAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: '$sellingPrice' } } },
    ]).exec();
    return result.length > 0 ? result[0].total : 0;
  }

  /** Category breakdown for homepage */
  async getCategoryStats(): Promise<
    Array<{ category: string; count: number; avgPrice: number }>
  > {
    return ListingModel.aggregate([
      { $match: { status: ListingStatus.Active } },
      {
        $group: {
          _id:      '$category',
          count:    { $sum: 1 },
          avgPrice: { $avg: '$sellingPrice' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
        },
      },
    ]).exec();
  }
}

export const listingRepository = new ListingRepository();
