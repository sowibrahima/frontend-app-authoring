import { Spinner } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm';
}

export const LoadingSpinner = ({ className, size }: LoadingSpinnerProps) => (
  <Spinner
    animation="border"
    className={className}
    role="status"
    variant="primary"
    size={size}
    screenReaderText={(
      <FormattedMessage
        id="authoring.loading"
        defaultMessage="Loading..."
        description="Screen-reader message for when a page is loading."
      />
    )}
  />
);

const Loading = () => (
  <div className="d-flex justify-content-center align-items-center flex-column vh-100">
    <LoadingSpinner />
  </div>
);

export default Loading;
