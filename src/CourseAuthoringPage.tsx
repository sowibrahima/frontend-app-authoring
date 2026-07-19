import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  useLocation,
} from 'react-router-dom';
import WutiskillStudioHeader from './header/WutiskillStudioHeader';
import WutiFooter from './footer/WutiFooter';
import NotFoundAlert from './generic/NotFoundAlert';
import PermissionDeniedAlert from './generic/PermissionDeniedAlert';
import { fetchOnlyStudioHomeData } from './studio-home/data/thunks';
import { getCourseAppsApiStatus } from './pages-and-resources/data/selectors';
import { RequestStatus } from './data/constants';
import Loading from './generic/Loading';
import { useCourseAuthoringContext } from './CourseAuthoringContext';
import './CourseAuthoringPage.scss';

interface Props {
  children?: React.ReactNode;
}

const CourseAuthoringPage = ({ children }: Props) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchOnlyStudioHomeData());
  }, []);

  const { courseId, courseDetails, courseDetailStatus } = useCourseAuthoringContext();
  const courseNumber = courseDetails?.number;
  const courseOrg = courseDetails?.org;
  const courseTitle = courseDetails?.name;
  const inProgress = courseDetailStatus === RequestStatus.IN_PROGRESS || courseDetailStatus === RequestStatus.PENDING;
  const courseAppsApiStatus = useSelector(getCourseAppsApiStatus);
  const { pathname } = useLocation();
  const isEditor = pathname.includes('/editor');

  if (courseDetailStatus === RequestStatus.NOT_FOUND && !isEditor) {
    return <NotFoundAlert />;
  }
  if (courseAppsApiStatus === RequestStatus.DENIED) {
    return <PermissionDeniedAlert />;
  }

  // Route pages depend on CourseAuthoringContext. Mounting them while the
  // course request is still pending lets child effects issue requests with an
  // undefined course id and also produces duplicate loading indicators.
  if (inProgress && !isEditor) {
    return (
      <div className="ws-course-authoring-shell">
        <Loading />
      </div>
    );
  }

  return (
    <div className={isEditor ? undefined : 'ws-course-authoring-shell'}>
      {
        /* While V2 Editors are temporarily served from their own pages
      using url pattern containing /editor/,
      we shouldn't have the header and footer on these pages.
      This functionality will be removed in TNL-9591 */
      }
      {!isEditor && (
        <WutiskillStudioHeader
          number={courseNumber}
          org={courseOrg}
          title={courseTitle}
          contextId={courseId}
        />
      )}
      {children}
      {!isEditor && <WutiFooter />}
    </div>
  );
};

export default CourseAuthoringPage;
