import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig, getConfig, getPath,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import React, { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Route, createRoutesFromElements, createBrowserRouter, RouterProvider,
} from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import '@edx/frontend-component-header';

import { initializeHotjar } from '@edx/frontend-enterprise-hotjar';
import { logError } from '@edx/frontend-platform/logging';
import messages from './i18n';

import {
  ComponentPicker,
  CreateLibrary,
  CreateLegacyLibrary,
  LibraryLayout,
  PreviewChangesEmbed,
} from './library-authoring';
import initializeStore from './store';
import CourseAuthoringRoutes from './CourseAuthoringRoutes';
import { CreateCourseWizard } from './create-course-wizard';
import CoursePlanTemplatesPage from './course-plan-templates/CoursePlanTemplatesPage';
import StudioFaqPage from './faq/StudioFaqPage';
import Head from './head/Head';
import { StudioHome } from './studio-home';
import CourseRerun from './course-rerun';
import { TaxonomyLayout, TaxonomyDetailPage, TaxonomyListPage } from './taxonomy';
import { ContentTagsDrawer } from './content-tags-drawer';
import AccessibilityPage from './accessibility-page';
import { ToastProvider } from './generic/toast-context';
import { ContentType } from './library-authoring/routes';
import './setupParagonOverlays';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';
import { LegacyLibMigrationPage } from './legacy-libraries-migration/LegacyLibMigrationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60_000, // If cache is up to one hour old, no need to re-fetch
    },
  },
});

const normalizeCatalogBaseUrl = (catalogUrl) => {
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

const isLegacyPublicUrl = (url) => {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return parsed.hostname === 'support.edx.org'
      || (
        parsed.hostname === 'localhost'
        && (
          parsed.pathname.startsWith('/support')
          || parsed.pathname.startsWith('/terms-of-service')
          || parsed.pathname.startsWith('/privacy-policy')
        )
      );
  } catch {
    return false;
  }
};

const buildCatalogPageUrl = (catalogBaseUrl, path) => {
  if (!catalogBaseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${catalogBaseUrl}${normalizedPath}`;
};

const App = () => {
  useEffect(() => {
    if (process.env.HOTJAR_APP_ID) {
      try {
        initializeHotjar({
          hotjarId: process.env.HOTJAR_APP_ID,
          hotjarVersion: process.env.HOTJAR_VERSION,
          hotjarDebug: !!process.env.HOTJAR_DEBUG,
        });
      } catch (error) {
        logError(error);
      }
    }
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/home" element={<StudioHome />} />
        <Route path="/faq" element={<StudioFaqPage />} />
        <Route path="/home/create-course" element={<CreateCourseWizard />} />
        <Route path="/home/course-templates" element={<CoursePlanTemplatesPage />} />
        <Route path="/libraries" element={<StudioHome />} />
        <Route path="/libraries-v1" element={<StudioHome />} />
        <Route path="/libraries-v1/migrate" element={<LegacyLibMigrationPage />} />
        <Route path="/libraries-v1/create" element={<CreateLegacyLibrary />} />
        <Route path="/library/create" element={<CreateLibrary />} />
        <Route path="/library/:libraryId/*" element={<LibraryLayout />} />
        <Route
          path="/component-picker"
          element={(
            <ComponentPicker
              extraFilter={['NOT block_type = "unit"', 'NOT block_type = "section"', 'NOT block_type = "subsection"']}
              visibleTabs={[ContentType.home, ContentType.components, ContentType.collections]}
            />
          )}
        />
        <Route
          path="/component-picker/multiple"
          element={(
            <ComponentPicker
              componentPickerMode="multiple"
              extraFilter={['NOT block_type = "unit"', 'NOT block_type = "section"', 'NOT block_type = "subsection"']}
              visibleTabs={[ContentType.home, ContentType.components, ContentType.collections]}
            />
          )}
        />
        <Route path="/legacy/preview-changes/:usageKey" element={<PreviewChangesEmbed />} />
        <Route path="/course/:courseId/*" element={<CourseAuthoringRoutes />} />
        <Route path="/course_rerun/:courseId" element={<CourseRerun />} />
        {getConfig().ENABLE_ACCESSIBILITY_PAGE === 'true' && (
          <Route path="/accessibility" element={<AccessibilityPage />} />
        )}
        {getConfig().ENABLE_TAGGING_TAXONOMY_PAGES === 'true' && (
          <>
            <Route path="/taxonomies" element={<TaxonomyLayout />}>
              <Route index element={<TaxonomyListPage />} />
            </Route>
            <Route path="/taxonomy" element={<TaxonomyLayout />}>
              <Route path="/taxonomy/:taxonomyId" element={<TaxonomyDetailPage />} />
            </Route>
            <Route
              path="/tagging/components/widget/:contentId"
              element={<ContentTagsDrawer />}
            />
          </>
        )}
      </Route>,
    ),
    {
      basename: getPath(getConfig().PUBLIC_PATH),
    },
  );

  return (
    <AppProvider store={initializeStore()} wrapWithRouter={false}>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <Head />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ToastProvider>
    </AppProvider>
  );
};

subscribe(APP_READY, () => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <ErrorPage message={error.message} />
    </StrictMode>,
  );
});

initialize({
  handlers: {
    config: () => {
      const searchCatalogUrl = process.env.SEARCH_CATALOG_URL || null;
      const catalogBaseUrl = normalizeCatalogBaseUrl(
        process.env.CATALOG_BASE_URL
        || searchCatalogUrl,
      ) || inferLocalCatalogBaseUrl();
      const resolvePublicPageUrl = (explicitUrl, path) => {
        const fallbackUrl = buildCatalogPageUrl(catalogBaseUrl, path);

        if (!explicitUrl || isLegacyPublicUrl(explicitUrl)) {
          return fallbackUrl || explicitUrl || null;
        }

        return explicitUrl;
      };

      mergeConfig({
        SUPPORT_URL: resolvePublicPageUrl(process.env.SUPPORT_URL, '/help'),
        SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || null,
        LEARNING_BASE_URL: process.env.LEARNING_BASE_URL,
        LMS_BASE_URL: process.env.LMS_BASE_URL || null,
        EXAMS_BASE_URL: process.env.EXAMS_BASE_URL || null,
        CALCULATOR_HELP_URL: process.env.CALCULATOR_HELP_URL || null,
        ENABLE_PROGRESS_GRAPH_SETTINGS: process.env.ENABLE_PROGRESS_GRAPH_SETTINGS || 'false',
        ENABLE_TEAM_TYPE_SETTING: process.env.ENABLE_TEAM_TYPE_SETTING === 'true',
        ENABLE_OPEN_MANAGED_TEAM_TYPE: process.env.ENABLE_OPEN_MANAGED_TEAM_TYPE === 'true',
        BBB_LEARN_MORE_URL: process.env.BBB_LEARN_MORE_URL || '',
        STUDIO_BASE_URL: process.env.STUDIO_BASE_URL || null,
        STUDIO_SHORT_NAME: process.env.STUDIO_SHORT_NAME || null,
        SEARCH_CATALOG_URL: searchCatalogUrl,
        CATALOG_BASE_URL: catalogBaseUrl,
        TERMS_OF_SERVICE_URL: resolvePublicPageUrl(process.env.TERMS_OF_SERVICE_URL, '/legal/terms'),
        PRIVACY_POLICY_URL: resolvePublicPageUrl(process.env.PRIVACY_POLICY_URL, '/legal/privacy'),
        ENABLE_ACCESSIBILITY_PAGE: process.env.ENABLE_ACCESSIBILITY_PAGE || 'false',
        NOTIFICATION_FEEDBACK_URL: process.env.NOTIFICATION_FEEDBACK_URL || null,
        ENABLE_UNIT_PAGE: process.env.ENABLE_UNIT_PAGE || 'false',
        ENABLE_ASSETS_PAGE: process.env.ENABLE_ASSETS_PAGE || 'false',
        ENABLE_VIDEO_UPLOAD_PAGE_LINK_IN_CONTENT_DROPDOWN: process.env.ENABLE_VIDEO_UPLOAD_PAGE_LINK_IN_CONTENT_DROPDOWN || 'false',
        ENABLE_CERTIFICATE_PAGE: process.env.ENABLE_CERTIFICATE_PAGE || 'false',
        ENABLE_TAGGING_TAXONOMY_PAGES: process.env.ENABLE_TAGGING_TAXONOMY_PAGES || 'false',
        ENABLE_STUDIO_HOME_TAXONOMIES_TAB: process.env.ENABLE_STUDIO_HOME_TAXONOMIES_TAB || 'false',
        ENABLE_LEGACY_LIBRARIES_TAB: process.env.ENABLE_LEGACY_LIBRARIES_TAB || 'false',
        ENABLE_CHECKLIST_QUALITY: process.env.ENABLE_CHECKLIST_QUALITY || 'true',
        ENABLE_GRADING_METHOD_IN_PROBLEMS: process.env.ENABLE_GRADING_METHOD_IN_PROBLEMS === 'true',
        LIBRARY_UNSUPPORTED_BLOCKS: (process.env.LIBRARY_UNSUPPORTED_BLOCKS || 'conditional,step-builder,problem-builder').split(','),
        COURSE_TEAM_SUPPORT_EMAIL: process.env.COURSE_TEAM_SUPPORT_EMAIL || null,
        ADMIN_CONSOLE_URL: process.env.ADMIN_CONSOLE_URL || null,
      }, 'CourseAuthoringConfig');
    },
  },
  messages,
  requireAuthenticatedUser: true,
});
