import { RequestStatus } from '../../data/constants';
import {
  getCourseBestPractices,
  getCourseLaunch,
} from './api';
import {
  fetchLaunchChecklistSuccess,
  updateLaunchChecklistStatus,
  fetchBestPracticeChecklistSuccess,
  updateBestPracticeChecklisttStatus,
} from './slice';

const launchChecklistRequests = new Map();
const bestPracticeRequests = new Map();

export function fetchCourseLaunchQuery({
  courseId,
  gradedOnly = true,
  validateOras = true,
  all = true,
}) {
  return async (dispatch) => {
    const requestKey = `${courseId}:${gradedOnly}:${validateOras}:${all}`;
    const pendingRequest = launchChecklistRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = (async () => {
      try {
        const data = await getCourseLaunch({
          courseId, gradedOnly, validateOras, all,
        });
        dispatch(fetchLaunchChecklistSuccess({ data }));
        dispatch(updateLaunchChecklistStatus({ status: RequestStatus.SUCCESSFUL }));
      } catch (error) {
        if (error.response && error.response.status === 403) {
          dispatch(updateLaunchChecklistStatus({ status: RequestStatus.DENIED }));
        } else {
          dispatch(updateLaunchChecklistStatus({ status: RequestStatus.FAILED }));
        }
      } finally {
        launchChecklistRequests.delete(requestKey);
      }
    })();

    launchChecklistRequests.set(requestKey, request);
    return request;
  };
}

export function fetchCourseBestPracticesQuery({
  courseId,
  excludeGraded = true,
  all = true,
}) {
  return async (dispatch) => {
    const requestKey = `${courseId}:${excludeGraded}:${all}`;
    const pendingRequest = bestPracticeRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = (async () => {
      try {
        const data = await getCourseBestPractices({ courseId, excludeGraded, all });
        dispatch(fetchBestPracticeChecklistSuccess({ data }));
        dispatch(updateBestPracticeChecklisttStatus({ status: RequestStatus.SUCCESSFUL }));
      } catch (error) {
        dispatch(updateBestPracticeChecklisttStatus({ status: RequestStatus.FAILED }));
      } finally {
        bestPracticeRequests.delete(requestKey);
      }
    })();

    bestPracticeRequests.set(requestKey, request);
    return request;
  };
}
