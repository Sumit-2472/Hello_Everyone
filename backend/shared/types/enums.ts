// ============================================================
// Amazon ReLife — Shared Enums
// Single source of truth for all discriminated union values
// ============================================================

export enum UserRole {
  Customer = 'customer',
  Seller = 'seller',
  WarehouseStaff = 'warehouse_staff',
  Admin = 'admin',
}

export enum ReturnStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Processing = 'processing',
  Completed = 'completed',
}

export enum CosmeticGrade {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
}

export enum FunctionalGrade {
  Operational = 'Operational',
  MinorIssues = 'Minor Issues',
  MajorIssues = 'Major Issues',
  NonFunctional = 'Non-Functional',
}

export enum PassportTier {
  Visual = 'visual',
  Mechanical = 'mechanical',
  Telemetry = 'telemetry',
}

export enum DisposalRoute {
  Resell = 'resell',
  Refurbish = 'refurbish',
  Donate = 'donate',
  Recycle = 'recycle',
  Exchange = 'exchange',
}

export enum ListingStatus {
  Active = 'active',
  Sold = 'sold',
  Reserved = 'reserved',
  Removed = 'removed',
}

export enum CreditAction {
  BuyRefurbished = 'buy_refurbished',
  DonateProduct = 'donate_product',
  ChooseSustainableRoute = 'choose_sustainable_route',
  ReturnReusable = 'return_reusable',
  ReferUser = 'refer_user',
  Redemption = 'redemption',
}

export enum ProductCategory {
  Electronics = 'electronics',
  Phones = 'phones',
  Laptops = 'laptops',
  Appliances = 'appliances',
  Furniture = 'furniture',
  Apparel = 'apparel',
  Shoes = 'shoes',
  Books = 'books',
  Tools = 'tools',
  Sports = 'sports',
  Toys = 'toys',
  Other = 'other',
}
