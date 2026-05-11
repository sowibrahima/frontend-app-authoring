// @ts-check
import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const getApiBaseUrl = () => getConfig().STUDIO_BASE_URL;
const inFlightRequests = new Map();

const coalesceRequest = async (key, requestFn) => {
  const pendingRequest = inFlightRequests.get(key);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = requestFn().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, request);
  return request;
};

export const getCourseBestPracticesApiUrl = ({
  courseId,
  excludeGraded,
  all,
}) => `${getApiBaseUrl()}/api/courses/v1/quality/${courseId}/?exclude_graded=${excludeGraded}&all=${all}`;

export const getCourseLaunchApiUrl = ({
  courseId,
  gradedOnly,
  validateOras,
  all,
}) => `${getApiBaseUrl()}/api/courses/v1/validation/${courseId}/?graded_only=${gradedOnly}&validate_oras=${validateOras}&all=${all}`;

/**
 * Get course best practices.
 * @param {{courseId: string, excludeGraded: boolean, all: boolean}} options
 * @returns {Promise<{isSelfPaced: boolean, sections: any, subsection: any, units: any, videos: any }>}
 */
export async function getCourseBestPractices({
  courseId,
  excludeGraded,
  all,
}) {
  return coalesceRequest(`quality:${courseId}:${excludeGraded}:${all}`, async () => {
    const { data } = await getAuthenticatedHttpClient()
      .get(getCourseBestPracticesApiUrl({ courseId, excludeGraded, all }));

    return camelCaseObject(data);
  });
}

/** @typedef {object} courseLaunchData
 * @property {boolean} isSelfPaced
 * @property {object} dates
 * @property {object} assignments
 * @property {object} grades
 * @property {number} grades.sum_of_weights
 * @property {object} certificates
 * @property {object} updates
 * @property {object} proctoring
 */

/**
 * Get course launch.
 * @param {{courseId: string, gradedOnly: boolean, validateOras: boolean, all: boolean}} options
 * @returns {Promise<courseLaunchData>}
 */
export async function getCourseLaunch({
  courseId,
  gradedOnly,
  validateOras,
  all,
}) {
  return coalesceRequest(`validation:${courseId}:${gradedOnly}:${validateOras}:${all}`, async () => {
    const { data } = await getAuthenticatedHttpClient()
      .get(getCourseLaunchApiUrl({
        courseId, gradedOnly, validateOras, all,
      }));

    return camelCaseObject(data);
  });
}
