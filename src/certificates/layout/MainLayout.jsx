import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';
import { RequestStatus } from '@src/data/constants';

import { SavingErrorAlert } from '../../generic/saving-error-alert';
import SubHeader from '../../generic/sub-header/SubHeader';
import messages from '../messages';
import HeaderButtons from './header-buttons/HeaderButtons';
import useLayout from './hooks/useLayout';

const MainLayout = ({ showHeaderButtons, children }) => {
  const intl = useIntl();

  const {
    errorMessage,
    savingStatus,
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
        <SavingErrorAlert
          isQueryFailed={savingStatus === RequestStatus.FAILED}
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
