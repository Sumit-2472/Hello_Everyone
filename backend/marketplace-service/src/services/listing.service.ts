import { ListingModel, IListing } from '../models/Listing.model';
import { GreenCreditModel, CREDIT_VALUES } from '../models/GreenCredit.model';
import { AppError } from '../../../shared/middleware/errorHandler';
import { MarketplaceListing, PaginatedResponse } from '../../../shared/types';

interface CreateListingInput {
  productId: string;
  passportId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  images: string[];
  trustCard: IListing['trustCard'];
}

interface ListingQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minHealthScore?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'health_desc' | 'newest';
}

export class ListingService {
  async createListing(input: CreateListingInput): Promise<MarketplaceListing> {
    const listing = await ListingModel.create({
      ...input,
      greenCreditsEarned: CREDIT_VALUES.buy_refurbished,
    });

    return this.toDTO(listing);
  }

  async getListings(query: ListingQuery): Promise<PaginatedResponse<MarketplaceListing>> {
    const {
      category,
      minPrice,
      maxPrice,
      minHealthScore,
      page = 1,
      limit = 20,
      sortBy = 'newest',
    } = query;

    const filter: Record<string, unknown> = { status: 'active' };

    if (category) filter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) (filter.price as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.price as Record<string, number>).$lte = maxPrice;
    }
    if (minHealthScore !== undefined) {
      filter['trustCard.healthScore'] = { $gte: minHealthScore };
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      health_desc: { 'trustCard.healthScore': -1 },
      newest: { createdAt: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.newest;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ListingModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ListingModel.countDocuments(filter),
    ]);

    return {
      items: items.map(this.toDTO),
      total,
      page,
      limit,
      hasNext: skip + items.length < total,
    };
  }

  async getListingById(id: string): Promise<MarketplaceListing> {
    const listing = await ListingModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!listing) throw new AppError('Listing not found', 404);
    return this.toDTO(listing);
  }

  async purchaseListing(listingId: string, buyerId: string): Promise<{ listing: MarketplaceListing; creditsEarned: number }> {
    const listing = await ListingModel.findById(listingId);
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.status !== 'active') throw new AppError('Listing is no longer available', 400);

    listing.status = 'sold';
    await listing.save();

    // Award green credits to buyer
    const credits = CREDIT_VALUES.buy_refurbished;
    await GreenCreditModel.create({
      userId: buyerId,
      action: 'buy_refurbished',
      credits,
      description: `Earned ${credits} green credits for buying refurbished: ${listing.title}`,
      relatedEntityId: listingId,
    });

    return { listing: this.toDTO(listing), creditsEarned: credits };
  }

  private toDTO(listing: any): MarketplaceListing {
    return {
      id: listing._id.toString(),
      productId: listing.productId,
      passportId: listing.passportId,
      sellerId: listing.sellerId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      originalPrice: listing.originalPrice,
      category: listing.category,
      images: listing.images,
      trustCard: listing.trustCard,
      status: listing.status,
      greenCreditsEarned: listing.greenCreditsEarned,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}

export const listingService = new ListingService();
