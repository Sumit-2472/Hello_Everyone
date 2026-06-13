import mongoose from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { ReturnRequestModel, IReturnRequest } from '../models/ReturnRequest.model';
import { ReturnStatus } from '../../../shared/types/enums';

export class ReturnRequestRepository extends BaseRepository<IReturnRequest> {
  constructor() {
    super(ReturnRequestModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findByUser(userId: string, page = 1, limit = 10) {
    return this.paginate(
      { userId: new mongoose.Types.ObjectId(userId) } as any,
      page,
      limit,
      { createdAt: -1 }
    );
  }

  async findByProduct(productId: string): Promise<IReturnRequest[]> {
    return ReturnRequestModel.find({
      productId: new mongoose.Types.ObjectId(productId),
    })
      .sort({ createdAt: -1 })
      .lean<IReturnRequest[]>()
      .exec();
  }

  async findByStatus(status: ReturnStatus): Promise<IReturnRequest[]> {
    return ReturnRequestModel.find({ status })
      .sort({ riskScore: -1, createdAt: 1 })
      .populate('userId', 'name email')
      .populate('productId', 'name category brand imageUrls originalPrice')
      .lean<IReturnRequest[]>()
      .exec();
  }

  /** Get all pending returns ordered by risk score (highest first for priority queue) */
  async getPriorityQueue(): Promise<IReturnRequest[]> {
    return ReturnRequestModel.find({ status: ReturnStatus.Pending })
      .sort({ riskScore: -1, createdAt: 1 })
      .populate('userId', 'name email returnCount')
      .populate('productId', 'name category brand originalPrice')
      .lean<IReturnRequest[]>()
      .exec();
  }

  /** Transition status with audit trail */
  async updateStatus(
    requestId: string,
    newStatus: ReturnStatus,
    note?: string,
    updatedBy?: string
  ): Promise<IReturnRequest | null> {
    return ReturnRequestModel.findByIdAndUpdate(
      requestId,
      {
        $set: { status: newStatus },
        $push: {
          statusHistory: {
            status: newStatus,
            timestamp: new Date(),
            note,
            updatedBy,
          },
        },
      },
      { new: true, runValidators: true }
    )
      .lean<IReturnRequest>()
      .exec();
  }

  /** Link passport to a return request once grading is complete */
  async linkPassport(
    requestId: string,
    passportId: string
  ): Promise<IReturnRequest | null> {
    return ReturnRequestModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          passportId: new mongoose.Types.ObjectId(passportId),
          status: ReturnStatus.Processing,
        },
        $push: {
          statusHistory: {
            status: ReturnStatus.Processing,
            timestamp: new Date(),
            note: 'Product passport created',
          },
        },
      },
      { new: true }
    )
      .lean<IReturnRequest>()
      .exec();
  }

  /** Check if an active return already exists for this user+product */
  async hasActiveReturn(userId: string, productId: string): Promise<boolean> {
    return this.exists({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      status: { $in: [ReturnStatus.Pending, ReturnStatus.Processing] },
    } as any);
  }

  /** Analytics: group returns by reason */
  async getReturnReasonStats(): Promise<Array<{ reason: string; count: number }>> {
    return ReturnRequestModel.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, reason: '$_id', count: 1 } },
    ]).exec();
  }
}

export const returnRequestRepository = new ReturnRequestRepository();
