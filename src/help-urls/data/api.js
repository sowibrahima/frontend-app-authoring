import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

export const getHelpUrlsApiUrl = () => `${getConfig().STUDIO_BASE_URL}/api/contentstore/v1/help_urls`;

let pendingHelpUrlsRequest = null;

export async function getHelpUrls() {
  if (pendingHelpUrlsRequest) {
    return pendingHelpUrlsRequest;
  }

  pendingHelpUrlsRequest = getAuthenticatedHttpClient()
    .get(getHelpUrlsApiUrl())
    .then(({ data }) => camelCaseObject(data))
    .finally(() => {
      pendingHelpUrlsRequest = null;
    });

  return pendingHelpUrlsRequest;
}
