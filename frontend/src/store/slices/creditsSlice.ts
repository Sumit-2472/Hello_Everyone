import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { creditsApi } from '../../api/creditsApi';

interface CreditTransaction {
  id: string;
  action: string;
  credits: number;
  description: string;
  createdAt: string;
}

interface SustainabilityMetrics {
  productsReused: number;
  co2SavedKg: number;
  wastePreventedKg: number;
  greenCreditsEarned: number;
  greenCreditsRedeemed: number;
}

interface CreditsState {
  transactions: CreditTransaction[];
  totalCredits: number;
  sustainability: SustainabilityMetrics | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  transactions: [],
  totalCredits: 0,
  sustainability: null,
  isLoading: false,
  error: null,
};

export const fetchMyCredits = createAsyncThunk('credits/fetchMine', async (_, { rejectWithValue }) => {
  try { return await creditsApi.getMyCredits(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});

export const fetchSustainabilityMetrics = createAsyncThunk('credits/fetchSustainability', async (_, { rejectWithValue }) => {
  try { return await creditsApi.getSustainabilityMetrics(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});

const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCredits.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyCredits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.totalCredits = action.payload.totalCredits;
      })
      .addCase(fetchMyCredits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSustainabilityMetrics.fulfilled, (state, action) => {
        state.sustainability = action.payload;
      });
  },
});

export default creditsSlice.reducer;
