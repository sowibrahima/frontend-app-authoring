import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { SavingErrorAlert } from '../../generic/saving-error-alert';
import ProcessingNotification from '../../generic/processing-notification';
import SubHeader from '../../generic/sub-header/SubHeader';
import messages from '../messages';
import HeaderButtons from './header-buttons/HeaderButtons';
import useLayout from './hooks/useLayout';

const MainLayout = ({ showHeaderButtons, children }) => {
  const intl = useIntl();

  const {
    errorMessage,
    savingStatus,
    isShowProcessingNotification,
    processingNotificationTitle,
  } = useLayout();

  return (
    <>
      <Container size="xl" className="certificates px-4">
        <div className="mt-5" />
        <SubHeader
          hideBorder
          title={intl.formatMessage(messages.headingTitle)}
          subtitle={intl.formatMessage(messages.headingSubtitle)}
          headerActions={showHeaderButtons && <HeaderButtons />}
        />
        <section>
          <article role="main">
            {children}
          </article>
        </section>
      </Container>
      <div className="certificates alert-toast">
        <ProcessingNotification
          isShow={isShowProcessingNotification}
          title={processingNotificationTitle}
        />
        <SavingErrorAlert
          savingStatus={savingStatus}
          errorMessage={errorMessage}
        />
      </div>
    </>
  );
};

MainLayout.defaultProps = {
  showHeaderButtons: false,
  children: null,
};

MainLayout.propTypes = {
  showHeaderButtons: PropTypes.bool,
  children: PropTypes.node,
};

export default MainLayout;
