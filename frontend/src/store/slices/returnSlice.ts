import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { returnApi } from '../../api/returnApi';

interface ReturnRiskResult {
  returnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string[];
}

interface SizeResult {
  recommendedSize: string;
  confidence: number;
  reasoning: string;
}

interface CompatibilityResult {
  isCompatible: boolean;
  confidence: number;
  details: string;
}

interface ReturnState {
  riskResult: ReturnRiskResult | null;
  sizeResult: SizeResult | null;
  compatibilityResult: CompatibilityResult | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReturnState = {
  riskResult: null,
  sizeResult: null,
  compatibilityResult: null,
  isLoading: false,
  error: null,
};

export const predictReturnRisk = createAsyncThunk('return/predictRisk', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await returnApi.predictReturnRisk(data); }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});

export const getRecommendedSize = createAsyncThunk('return/recommendSize', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await returnApi.recommendSize(data); }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});

export const checkCompatibility = createAsyncThunk('return/checkCompatibility', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await returnApi.checkCompatibility(data); }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed'); }
});

const returnSlice = createSlice({
  name: 'return',
  initialState,
  reducers: {
    clearResults(state) {
      state.riskResult = null;
      state.sizeResult = null;
      state.compatibilityResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(predictReturnRisk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(predictReturnRisk.fulfilled, (state, action) => { state.isLoading = false; state.riskResult = action.payload; })
      .addCase(predictReturnRisk.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(getRecommendedSize.pending, (state) => { state.isLoading = true; })
      .addCase(getRecommendedSize.fulfilled, (state, action) => { state.isLoading = false; state.sizeResult = action.payload; })
      .addCase(getRecommendedSize.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(checkCompatibility.pending, (state) => { state.isLoading = true; })
      .addCase(checkCompatibility.fulfilled, (state, action) => { state.isLoading = false; state.compatibilityResult = action.payload; })
      .addCase(checkCompatibility.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
  },
});

export const { clearResults } = returnSlice.actions;
export default returnSlice.reducer;
