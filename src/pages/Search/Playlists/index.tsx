import { FC, memo, useEffect } from 'react';

import NoSearchResults from '../NoResults';
import SearchPlaylistsPageContainer from './container';

// Utils
import { useParams } from 'react-router-dom';

// Redux
import { searchActions } from '../../../store/slices/search';
import { useAppDispatch, useAppSelector } from '../../../store/store';

interface SearchPageProps {
  container: React.RefObject<HTMLDivElement | null>;
}

export const SearchPlaylistsPage: FC<SearchPageProps> = memo((props) => {
  const dispatch = useAppDispatch();
  const params = useParams<{ search: string }>();

  const loading = useAppSelector((state) => state.search.loading);
  const playlists = useAppSelector((state) => state.search.playlists);

  useEffect(() => {
    dispatch(searchActions.setSection({ section: 'PLAYLISTS' }));
  }, [dispatch]);

  useEffect(() => {
    if (params.search) {
      dispatch(searchActions.fetchPlaylists(params.search));
    }
  }, [dispatch, params.search]);

  if (loading) return null;

  if (!playlists) {
    return <NoSearchResults searchValue={params.search || ''} />;
  }

  return <SearchPlaylistsPageContainer {...props} />;
});

export default SearchPlaylistsPage;