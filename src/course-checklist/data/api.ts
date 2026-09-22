import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const getApiBaseUrl = () => getConfig().STUDIO_BASE_URL;
const inFlightRequests = new Map<string, Promise<any>>();

const coalesceRequest = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  const pendingRequest = inFlightRequests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }
  const request = requestFn().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, request);
  return request;
};

export interface CourseBestPracticesRequest {
  courseId: string;
  excludeGraded?: boolean;
  all?: boolean;
}

export const getCourseBestPracticesApiUrl = ({
  courseId,
  excludeGraded = true,
  all = true,
}: CourseBestPracticesRequest) => (
  `${getApiBaseUrl()}/api/courses/v1/quality/${courseId}/?exclude_graded=${excludeGraded}&all=${all}`
);

export interface CourseLaunchRequest {
  courseId: string;
  gradedOnly?: boolean;
  validateOras?: boolean;
  all?: boolean;
}

export const getCourseLaunchApiUrl = ({
  courseId,
  gradedOnly = true,
  validateOras = true,
  all = true,
}: CourseLaunchRequest) => (
  `${getApiBaseUrl()}/api/courses/v1/validation/${courseId}/?graded_only=${gradedOnly}&validate_oras=${validateOras}&all=${all}`
);

export interface CourseBestPractices {
  isSelfPaced: boolean;
  sections: Record<string, any>;
  subsection: Record<string, any>;
  units: Record<string, any>;
  videos: Record<string, any>;
}

/**
 * Get course best practices.
 */
export async function getCourseBestPractices({
  courseId,
  excludeGraded,
  all,
}: CourseBestPracticesRequest): Promise<CourseBestPractices> {
  const url = getCourseBestPracticesApiUrl({ courseId, excludeGraded, all });
  return coalesceRequest(url, async () => {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  });
}

export interface CourseLaunchData {
  isSelfPaced: boolean;
  dates: {
    hasEndDate: boolean;
    hasStartDate: boolean;
  };
  assignments: Record<string, any>;
  grades: {
    hasGradingPolicy: boolean;
    sumOfWeights: number;
  };
  certificates: {
    hasCertificate: boolean;
    isActivated: boolean;
    isEnabled: boolean;
  };
  updates: {
    hasUpdate: boolean;
  };
  proctoring: {
    hasProctoringEscalationEmail: boolean;
    needsProctoringEscalationEmail: boolean;
  };
}

/**
 * Get course launch.
 */
export async function getCourseLaunch({
  courseId,
  gradedOnly,
  validateOras,
  all,
}: CourseLaunchRequest): Promise<CourseLaunchData> {
  const url = getCourseLaunchApiUrl({ courseId, gradedOnly, validateOras, all });
  return coalesceRequest(url, async () => {
    const { data } = await getAuthenticatedHttpClient().get(url);
    return camelCaseObject(data);
  });
}
