import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Services
import { categoriesService } from '../../services/categories';

// Interfaces
import type { Category } from '../../interfaces/categories';
import { RootState } from '../store';

const initialState: {
  loading: boolean;
  categories: Category[];
} = {
  loading: true,
  categories: [],
};

export const fetchCategories = createAsyncThunk('browse/fetchCategories', async (_, api) => {
  try {
    const response = await categoriesService.fetchCategories({ limit: 50 });
    const items = response.data.categories.items || [];
    return items;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
});

const browseSlice = createSlice({
  name: 'browse',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload;
    });
  },
});

export const browseActions = {
  ...browseSlice.actions,
  fetchCategories,
};

export default browseSlice.reducer;
