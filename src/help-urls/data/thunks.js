import { RequestStatus } from '../../data/constants';

import { getHelpUrls } from './api';
import { updateLoadingHelpUrlsStatus, updatePages } from './slice';

let pendingHelpUrlsRequest = null;

export function fetchHelpUrls() {
  return async (dispatch) => {
    if (pendingHelpUrlsRequest) {
      return pendingHelpUrlsRequest;
    }

    dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.IN_PROGRESS }));

    pendingHelpUrlsRequest = (async () => {
      try {
        const urls = await getHelpUrls();

        dispatch(updatePages(urls));

        dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.SUCCESSFUL }));
        return true;
      } catch (error) {
        dispatch(updateLoadingHelpUrlsStatus({ status: RequestStatus.FAILED }));

        return false;
      } finally {
        pendingHelpUrlsRequest = null;
      }
    })();

    return pendingHelpUrlsRequest;
  };
}
