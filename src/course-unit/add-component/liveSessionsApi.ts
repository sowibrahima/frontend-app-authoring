import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { logInfo } from '@edx/frontend-platform/logging';

export type LiveSessionsCapability = {
  enabled: boolean,
  orgDisabled?: boolean,
  isInstructor?: boolean,
  error?: string,
};

type HttpError = {
  message?: string,
  response?: {
    status?: number,
  },
};

const getLiveSessionsCapabilityUrl = (courseId: string) => (
  `${getConfig().LMS_BASE_URL}/api/live-sessions/course/${encodeURIComponent(courseId)}/capability/`
);

export const getLiveSessionsCapability = async (courseId: string): Promise<LiveSessionsCapability> => {
  try {
    const { data } = await getAuthenticatedHttpClient().get(getLiveSessionsCapabilityUrl(courseId));
    return camelCaseObject(data) as LiveSessionsCapability;
  } catch (error) {
    const httpError = error as HttpError;
    const httpErrorStatus = httpError?.response?.status;

    if (![403, 404].includes(httpErrorStatus ?? 0)) {
      logInfo(`Live sessions capability unavailable for ${courseId}: ${httpError?.message ?? 'unknown error'}`);
    }

    return { enabled: false };
  }
};
