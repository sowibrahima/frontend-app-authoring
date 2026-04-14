import { getConfig } from '@edx/frontend-platform';

const normalizeCatalogBaseUrl = (catalogUrl?: string | null) => {
  if (!catalogUrl) {
    return null;
  }

  return String(catalogUrl)
    .replace(/\/$/, '')
    .replace(/\/courses(?:\/.*)?$/, '');
};

const inferLocalCatalogBaseUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { protocol, hostname } = window.location;

  if (hostname === 'apps.local.openedx.io') {
    return `${protocol}//${hostname}:1998/catalog`;
  }

  if (hostname === 'local.openedx.io' || hostname === 'studio.local.openedx.io') {
    return `${protocol}//apps.local.openedx.io:1998/catalog`;
  }

  if (hostname === 'localhost') {
    return `${protocol}//localhost:1998/catalog`;
  }

  return null;
};

export const getCatalogBaseUrl = () => {
  const config = getConfig();
  return normalizeCatalogBaseUrl(
    (config.SEARCH_CATALOG_URL as string | null)
    || (config.CATALOG_BASE_URL as string | null)
    || null,
  ) || inferLocalCatalogBaseUrl();
};

export const getPublicSiteUrl = (path: string) => {
  const baseUrl = getCatalogBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};
