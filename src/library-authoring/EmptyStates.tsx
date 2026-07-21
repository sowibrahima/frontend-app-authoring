import { FormattedMessage } from '@edx/frontend-platform/i18n';
import type { MessageDescriptor } from 'react-intl';
import {
  Alert,
  Button,
  Stack,
} from '@openedx/paragon';
import { Add } from '@openedx/paragon/icons';
import { ClearFiltersButton } from '../search-manager';
import messages from './messages';
import { useOptionalLibraryContext } from './common/context/LibraryContext';

export const NoComponents = ({
  infoText = messages.noComponents,
  addBtnText = messages.addComponent,
  handleBtnClick,
}: {
  infoText?: MessageDescriptor;
  addBtnText?: MessageDescriptor;
  handleBtnClick?: () => void;
}) => {
  const { readOnly } = useOptionalLibraryContext();

  return (
    <Stack direction="horizontal" gap={3} className="library-empty-state mt-6 justify-content-center">
      <FormattedMessage {...infoText} />
      {!readOnly && handleBtnClick && (
        <Button iconBefore={Add} onClick={handleBtnClick}>
          <FormattedMessage {...addBtnText} />
        </Button>
      )}
    </Stack>
  );
};

export const NoSearchResults = ({
  infoText = messages.noSearchResults,
}: {
  infoText?: MessageDescriptor;
}) => (
  <Stack direction="horizontal" gap={3} className="my-6 justify-content-center">
    <FormattedMessage {...infoText} />
    <ClearFiltersButton variant="primary" size="md" />
  </Stack>
);

export const SearchError = ({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="danger" className="my-4">
    <Alert.Heading>
      <FormattedMessage {...messages.searchUnavailableTitle} />
    </Alert.Heading>
    <p><FormattedMessage {...messages.searchUnavailableBody} /></p>
    <Button variant="outline-primary" onClick={onRetry}>
      <FormattedMessage {...messages.retrySearch} />
    </Button>
  </Alert>
);
