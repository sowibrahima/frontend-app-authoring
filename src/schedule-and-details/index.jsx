import { useSelector } from 'react-redux';
import {
  Container, Button, StatefulButton,
} from '@openedx/paragon';
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Warning as WarningIcon,
} from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import Placeholder from '../editors/Placeholder';
import { RequestStatus } from '../data/constants';
import AlertMessage from '../generic/alert-message';
import InternetConnectionAlert from '../generic/internet-connection-alert';
import { STATEFUL_BUTTON_STATES } from '../constants';
import getPageHeadTitle from '../generic/utils';
import { useScrollToHashElement } from '../hooks';
import { useCourseAuthoringContext } from '../CourseAuthoringContext';
import {
  fetchCourseSettingsQuery,
  fetchCourseDetailsQuery,
  updateCourseDetailsQuery,
} from './data/thunks';
import {
  getCourseSettings,
  getCourseDetails,
  getLoadingDetailsStatus,
  getLoadingSettingsStatus,
} from './data/selectors';
import BasicSection from './basic-section';
import CreditSection from './credit-section';
import DetailsSection from './details-section';
import IntroducingSection from './introducing-section';
import PacingSection from './pacing-section';
import ScheduleSection from './schedule-section';
import LearningOutcomesSection from './learning-outcomes-section';
import InstructorsSection from './instructors-section';
import RequirementsSection from './requirements-section';
import LicenseSection from './license-section';
import messages from './messages';
import { useLoadValuesPrompt, useSaveValuesPrompt } from './hooks';

const ScheduleAndDetails = () => {
  const intl = useIntl();
  const courseSettings = useSelector(getCourseSettings);
  const courseDetails = useSelector(getCourseDetails);
  const loadingDetailsStatus = useSelector(getLoadingDetailsStatus);
  const loadingSettingsStatus = useSelector(getLoadingSettingsStatus);
  const isLoading = loadingDetailsStatus === RequestStatus.IN_PROGRESS
    || loadingSettingsStatus === RequestStatus.IN_PROGRESS;

  const { courseId, courseDetails: course } = useCourseAuthoringContext();
  document.title = getPageHeadTitle(course?.name, intl.formatMessage(messages.headingTitle));

  const {
    platformName,
    isCreditCourse,
    upgradeDeadline,
    languageOptions,
    marketingEnabled,
    licensingEnabled,
    aboutPageEditable,
    courseDisplayName,
    sidebarHtmlEnabled,
    lmsLinkForAboutPage,
    enrollmentEndEditable,
    isEntranceExamsEnabled,
    creditEligibilityEnabled,
    shortDescriptionEditable,
    enableExtendedCourseDetails,
    isPrerequisiteCoursesEnabled,
    possiblePreRequisiteCourses,
    canShowCertificateAvailableDateField,
  } = courseSettings;

  const {
    showLoadFailedAlert,
  } = useLoadValuesPrompt(
    courseId,
    fetchCourseDetailsQuery,
    fetchCourseSettingsQuery,
  );

  const {
    errorFields,
    savingStatus,
    editedValues,
    isQueryPending,
    isEditableState,
    showModifiedAlert,
    showSuccessfulAlert,
    showFailedAlert,
    handleResetValues,
    handleValuesChange,
    handleUpdateValues,
    handleInternetConnectionFailed,
  } = useSaveValuesPrompt(
    courseId,
    updateCourseDetailsQuery,
    canShowCertificateAvailableDateField,
    courseDetails,
  );

  const {
    org,
    courseId: courseNumber,
    run,
    title,
    effort,
    endDate,
    license,
    language,
    subtitle,
    duration,
    selfPaced,
    startDate,
    introVideo,
    description,
    learningInfo,
    enrollmentEnd,
    instructorInfo,
    enrollmentStart,
    shortDescription,
    preRequisiteCourses,
    entranceExamEnabled,
    courseImageAssetPath,
    bannerImageAssetPath,
    certificateAvailableDate,
    entranceExamMinimumScorePct,
    certificatesDisplayBehavior,
    videoThumbnailImageAssetPath,
  } = editedValues;

  useScrollToHashElement({ isLoading });
  // No need to get overview and aboutSidebarHtml from editedValues
  // As updating them re-renders TinyMCE
  // Which causes issues with TinyMCE editor cursor position
  // https://www.tiny.cloud/docs/tinymce/5/react/#initialvalue
  const { overview: initialOverview } = courseDetails || {};
  const { aboutSidebarHtml: initialAboutSidebarHtml } = courseDetails || {};

  if (isLoading) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }

  if (loadingDetailsStatus === RequestStatus.DENIED || loadingSettingsStatus === RequestStatus.DENIED) {
    return (
      <div className="row justify-content-center m-6">
        <Placeholder />
      </div>
    );
  }

  const showCreditSection = creditEligibilityEnabled && isCreditCourse;
  const showRequirementsSection = aboutPageEditable || isPrerequisiteCoursesEnabled || isEntranceExamsEnabled;
  const hasErrors = !!Object.keys(errorFields).length;
  const updateValuesButtonState = {
    labels: {
      default: intl.formatMessage(messages.buttonSaveText),
      pending: intl.formatMessage(messages.buttonSavingText),
    },
    disabledStates: [STATEFUL_BUTTON_STATES.pending],
  };
  const alertWhileSavingTitle = hasErrors
    ? intl.formatMessage(messages.alertWarningOnSaveWithError)
    : intl.formatMessage(messages.alertWarning);

  const alertWhileSavingDescription = hasErrors
    ? intl.formatMessage(messages.alertWarningDescriptionsOnSaveWithError)
    : intl.formatMessage(messages.alertWarningDescriptions);

  return (
    <>
      <Container size="xl" className="schedule-and-details px-4">
        <div className="mt-5">
          <AlertMessage
            show={showSuccessfulAlert}
            variant="success"
            icon={CheckCircleIcon}
            title={intl.formatMessage(messages.alertSuccess)}
            aria-hidden="true"
            aria-labelledby={intl.formatMessage(
              messages.alertSuccessAriaLabelledby,
            )}
            aria-describedby={intl.formatMessage(
              messages.alertSuccessAriaDescribedby,
            )}
          />
          <AlertMessage
            show={showLoadFailedAlert}
            variant="danger"
            icon={ErrorOutlineIcon}
            title={intl.formatMessage(messages.alertLoadFail)}
            aria-hidden="true"
            aria-labelledby={intl.formatMessage(
              messages.alertFailAriaLabelledby,
            )}
            aria-describedby={intl.formatMessage(
              messages.alertFailAriaDescribedby,
            )}
          />
          <AlertMessage
            show={showFailedAlert}
            variant="danger"
            icon={ErrorOutlineIcon}
            title={intl.formatMessage(messages.alertFail)}
            aria-hidden="true"
            aria-labelledby={intl.formatMessage(
              messages.alertFailAriaLabelledby,
            )}
            aria-describedby={intl.formatMessage(
              messages.alertFailAriaDescribedby,
            )}
          />
          <header>
            <span className="small text-gray-700">
              {intl.formatMessage(messages.headingSubtitle)}
            </span>
            <h2 className="mb-4 pb-1">
              {intl.formatMessage(messages.headingTitle)}
            </h2>
          </header>
        </div>
        <section className="setting-items mb-4">
          <div className="schedule-and-details__layout">
            <article className="schedule-and-details__main">
              <PacingSection
                selfPaced={selfPaced}
                startDate={startDate}
                onChange={handleValuesChange}
              />
              <ScheduleSection
                endDate={endDate}
                startDate={startDate}
                errorFields={errorFields}
                platformName={platformName}
                enrollmentEnd={enrollmentEnd}
                enrollmentStart={enrollmentStart}
                upgradeDeadline={upgradeDeadline}
                enrollmentEndEditable={enrollmentEndEditable}
                certificateAvailableDate={certificateAvailableDate}
                certificatesDisplayBehavior={certificatesDisplayBehavior}
                canShowCertificateAvailableDateField={canShowCertificateAvailableDateField}
                onChange={handleValuesChange}
              />
              {showCreditSection && (
                <CreditSection
                  creditRequirements={courseSettings?.creditRequirements}
                />
              )}
              {aboutPageEditable && (
                <DetailsSection
                  language={language}
                  languageOptions={languageOptions}
                  onChange={handleValuesChange}
                />
              )}
              <IntroducingSection
                title={title}
                overview={initialOverview}
                duration={duration}
                subtitle={subtitle}
                introVideo={introVideo}
                description={description}
                aboutSidebarHtml={initialAboutSidebarHtml}
                shortDescription={shortDescription}
                aboutPageEditable={aboutPageEditable}
                sidebarHtmlEnabled={sidebarHtmlEnabled}
                lmsLinkForAboutPage={lmsLinkForAboutPage}
                courseImageAssetPath={courseImageAssetPath}
                bannerImageAssetPath={bannerImageAssetPath}
                shortDescriptionEditable={shortDescriptionEditable}
                enableExtendedCourseDetails={enableExtendedCourseDetails}
                videoThumbnailImageAssetPath={videoThumbnailImageAssetPath}
                onChange={handleValuesChange}
              />
              {enableExtendedCourseDetails && (
                <>
                  <LearningOutcomesSection
                    learningInfo={learningInfo}
                    onChange={handleValuesChange}
                  />
                  <InstructorsSection
                    instructors={instructorInfo?.instructors}
                    onChange={handleValuesChange}
                  />
                </>
              )}
              {showRequirementsSection && (
                <RequirementsSection
                  effort={effort}
                  errorFields={errorFields}
                  aboutPageEditable={aboutPageEditable}
                  entranceExamEnabled={entranceExamEnabled}
                  preRequisiteCourses={preRequisiteCourses}
                  isEntranceExamsEnabled={isEntranceExamsEnabled}
                  possiblePreRequisiteCourses={possiblePreRequisiteCourses}
                  entranceExamMinimumScorePct={entranceExamMinimumScorePct}
                  isPrerequisiteCoursesEnabled={
                    isPrerequisiteCoursesEnabled
                  }
                  onChange={handleValuesChange}
                />
              )}
              {licensingEnabled && (
                <LicenseSection
                  license={license}
                  onChange={handleValuesChange}
                />
              )}
            </article>
            <aside className="schedule-and-details__summary">
              <BasicSection
                org={org}
                courseNumber={courseNumber}
                run={run}
                lmsLinkForAboutPage={lmsLinkForAboutPage}
                marketingEnabled={marketingEnabled}
                courseDisplayName={courseDisplayName}
                platformName={platformName}
              />
            </aside>
          </div>
        </section>
      </Container>
      <div className="alert-toast">
        {!isEditableState && (
          <InternetConnectionAlert
            isFailed={savingStatus === RequestStatus.FAILED}
            isQueryPending={isQueryPending}
            onInternetConnectionFailed={handleInternetConnectionFailed}
          />
        )}
        <AlertMessage
          show={showModifiedAlert}
          aria-hidden={showModifiedAlert}
          aria-labelledby={intl.formatMessage(
            messages.alertWarningAriaLabelledby,
          )}
          aria-describedby={intl.formatMessage(
            messages.alertWarningAriaDescribedby,
          )}
          role="dialog"
          actions={[
            !isQueryPending && (
              <Button
                key="cancel-button"
                variant="tertiary"
                onClick={handleResetValues}
              >
                {intl.formatMessage(messages.buttonCancelText)}
              </Button>
            ),
            <StatefulButton
              key="save-button"
              onClick={handleUpdateValues}
              disabled={hasErrors}
              state={
                isQueryPending
                  ? STATEFUL_BUTTON_STATES.pending
                  : STATEFUL_BUTTON_STATES.default
              }
              {...updateValuesButtonState}
            />,
          ].filter(Boolean)}
          variant="warning"
          icon={WarningIcon}
          title={alertWhileSavingTitle}
          description={alertWhileSavingDescription}
        />
      </div>
    </>
  );
};

export default ScheduleAndDetails;
