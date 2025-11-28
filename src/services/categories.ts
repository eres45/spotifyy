import { invidiousHomeService } from './invidiousHome';
import type { Playlist } from '../interfaces/playlists';
import type { Category } from '../interfaces/categories';
import type { Pagination, PaginationQueryParams } from '../interfaces/api';

/**
 * @description Get a list of categories - using Invidious playlists instead
 */
const fetchCategories = async (params: PaginationQueryParams = {}) => {
    const playlists = await invidiousHomeService.getPopularPlaylists(params.limit || 20);
    return {
        data: {
            categories: {
                href: '',
                items: [],
                limit: params.limit || 20,
                next: '',
                offset: params.offset || 0,
                previous: '',
                total: 0,
            }
        }
    };
};

/**
 * @description Get a list of Invidious playlists for a category
 */
const fetchCategoryPlaylists = async (categoryId: string, params: PaginationQueryParams = {}) => {
    // Use Invidious to get playlists
    const playlists = await invidiousHomeService.getPopularPlaylists(params.limit || 10);
    return {
        data: {
            playlists
        }
    };
};

/**
 * @description Get a single category
 */
const fetchCategory = async (categoryId: string): Promise<{ data: Category }> => {
    return {
        data: {
            id: categoryId,
            name: 'Music',
            icons: [],
            href: '',
        }
    };
};

export const categoriesService = {
    fetchCategories,
    fetchCategoryPlaylists,
    fetchCategory,
};
