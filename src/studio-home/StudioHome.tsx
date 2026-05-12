import React from 'react';
import {
  Container,
  Icon,
  MailtoLink,
  Row,
} from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';
import SharedHeader from '@edx/frontend-component-header';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useLocation, useNavigate } from 'react-router-dom';

import Loading from '../generic/Loading';
import InternetConnectionAlert from '../generic/internet-connection-alert';
import TabsSection from './tabs-section';
import OrganizationSection from './organization-section';
import VerifyEmailLayout from './verify-email-layout';
import messages from './messages';
import { useStudioHome } from './hooks';
import AlertMessage from '../generic/alert-message';
import { createCorrectInternalRoute } from '../utils';
import WutiFooter from '../footer/WutiFooter';

const StudioHome = () => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isLoadingPage,
    isFailedLoadingPage,
    studioHomeData,
    isShowProcessing,
    anyQueryIsFailed,
    isShowEmailStaff,
    anyQueryIsPending,
    isShowOrganizationDropdown,
    hasAbilityToCreateNewCourse,
    isFiltered,
    librariesV1Enabled,
    librariesV2Enabled,
  } = useStudioHome();

  const v1LibraryTab = librariesV1Enabled && location?.pathname.split('/').pop() === 'libraries-v1';
  const showV2LibraryURL = librariesV2Enabled && !v1LibraryTab;

  const {
    userIsActive,
    studioRequestEmail,
    showNewLibraryButton,
    showNewLibraryV2Button,
  } = studioHomeData;
  const studioShortName = studioHomeData?.studioShortName || getConfig().STUDIO_SHORT_NAME || 'WutiSkill Studio';

  const shouldShowNewLibraryButton = (
    (showNewLibraryButton && !showV2LibraryURL)
    || (showV2LibraryURL && showNewLibraryV2Button)
  );

  const handleCreateLibrary = () => {
    if (showV2LibraryURL) {
      navigate('/library/create');
      return;
    }
    navigate('/libraries-v1/create');
  };

  if (isLoadingPage && !isFiltered) {
    return (<Loading />);
  }

  const getMainBody = () => {
    if (isFailedLoadingPage) {
      return (
        <AlertMessage
          variant="danger"
          description={(
            <Row className="m-0 align-items-center">
              <Icon src={Error} className="text-danger-500 mr-1" />
              <span>{intl.formatMessage(messages.homePageLoadFailedMessage)}</span>
            </Row>
          )}
        />
      );
    }
    if (!userIsActive) {
      return <VerifyEmailLayout />;
    }
    return (
      <section className="ws-studio-home">
        <header className="ws-studio-home__hero">
          <div className="ws-studio-home__hero-copy">
            <span className="ws-studio-home__status-pill">
              {intl.formatMessage(messages.heroStatusPill)}
            </span>
            <h1 className="ws-studio-home__title">
              {intl.formatMessage(messages.headingTitle, { studioShortName })}
            </h1>
          </div>
          <div className="ws-studio-home__hero-actions">
            {hasAbilityToCreateNewCourse && (
              <button
                type="button"
                className="ws-studio-home__create-course-btn"
                onClick={() => navigate('/home/create-course')}
              >
                {intl.formatMessage(messages.addNewCourseBtnText)}
                <span className="ws-studio-home__create-course-btn-icon">+</span>
              </button>
            )}
            {shouldShowNewLibraryButton && (
              <button
                type="button"
                className="ws-studio-home__new-library-btn"
                onClick={handleCreateLibrary}
              >
                {intl.formatMessage(messages.addNewLibraryBtnText)}
              </button>
            )}
            {isShowEmailStaff && (
              <MailtoLink to={studioRequestEmail} className="ws-studio-home__email-staff-link">
                {intl.formatMessage(messages.emailStaffBtnText)}
              </MailtoLink>
            )}
          </div>
        </header>

        {isShowOrganizationDropdown && <OrganizationSection />}

        <TabsSection
          showNewCourseContainer={false}
          onClickNewCourse={() => navigate('/home/create-course')}
          isShowProcessing={Boolean(isShowProcessing) && !isFiltered}
          librariesV1Enabled={librariesV1Enabled}
          librariesV2Enabled={librariesV2Enabled}
        />
      </section>
    );
  };

  return (
    <>
      <SharedHeader
        mainMenuItems={[]}
        secondaryMenuItems={[]}
        logoDestination={createCorrectInternalRoute('/home')}
        showStudioLinkInUserMenu={false}
        userMenuVariant="studio"
      />
      <div className="ws-studio-home-page">
        <Container size="xl" className="ws-studio-home-container">
          {getMainBody()}
        </Container>
      </div>
      <div className="alert-toast">
        <InternetConnectionAlert
          isFailed={anyQueryIsFailed}
          isQueryPending={anyQueryIsPending}
        />
      </div>
      <WutiFooter />
    </>
  );
};

export default StudioHome;
