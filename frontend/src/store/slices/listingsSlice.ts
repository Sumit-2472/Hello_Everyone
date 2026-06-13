import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { marketplaceApi } from '../../api/marketplaceApi';

interface TrustCard {
  healthScore: number;
  cosmeticGrade: string;
  functionalGrade: string;
  batteryHealth?: number;
  aiVerified: boolean;
  warrantyMonths: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  images: string[];
  trustCard: TrustCard;
  status: string;
  greenCreditsEarned: number;
  createdAt: string;
}

interface ListingsState {
  items: Listing[];
  selectedListing: Listing | null;
  total: number;
  page: number;
  hasNext: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ListingsState = {
  items: [],
  selectedListing: null,
  total: 0,
  page: 1,
  hasNext: false,
  isLoading: false,
  error: null,
};

export const fetchListings = createAsyncThunk(
  'listings/fetchAll',
  async (params: Record<string, string | number | undefined>, { rejectWithValue }) => {
    try {
      return await marketplaceApi.getListings(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch listings');
    }
  }
);

export const fetchListingById = createAsyncThunk(
  'listings/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await marketplaceApi.getListingById(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch listing');
    }
  }
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    clearSelectedListing(state) {
      state.selectedListing = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.hasNext = action.payload.hasNext;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchListingById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchListingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedListing = action.payload;
      })
      .addCase(fetchListingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedListing } = listingsSlice.actions;
export default listingsSlice.reducer;
