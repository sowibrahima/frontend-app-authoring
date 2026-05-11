import { Link } from 'react-router-dom';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon, Stack } from '@openedx/paragon';
import { OpenInNew as OpenInNewIcon } from '@openedx/paragon/icons';

import type { ClipboardStatus } from '../../../data/api';
import messages from '../messages';

interface PopoverContentProps {
  clipboardData: ClipboardStatus,
}

const sourceTitleIsReadable = (sourceContextTitle?: string) => (
  Boolean(sourceContextTitle && !/^[A-Z0-9_-]{6,}$/.test(sourceContextTitle))
);

const PopoverContent = ({ clipboardData } : PopoverContentProps) => {
  const intl = useIntl();
  const { sourceEditUrl, content, sourceContextTitle } = clipboardData;

  // istanbul ignore if: this should never happen
  if (!content) {
    return null;
  }

  const showSourceTitle = sourceTitleIsReadable(sourceContextTitle);

  const contentNode = (
    <Stack gap={1}>
      <Stack className="justify-content-between" direction="horizontal">
        <strong>{content.displayName}</strong>
        {sourceEditUrl && (
          <Icon className="clipboard-popover-icon m-0" src={OpenInNewIcon} />
        )}
      </Stack>
      <div className="clipboard-popover-detail">
        <small className="clipboard-popover-detail-block-type">
          {content.blockTypeDisplay}
        </small>
        {showSourceTitle && (
          <span className="clipboard-popover-detail-source">
            <span className="mr-1">{intl.formatMessage(messages.popoverContentText)}</span>
            <span className="clipboard-popover-detail-course-name">
              {sourceContextTitle}
            </span>
          </span>
        )}
      </div>
    </Stack>
  );

  if (sourceEditUrl) {
    return (
      <Link
        className="clipboard-popover-title"
        data-testid="popover-content"
        to={sourceEditUrl}
        target="_blank"
      >
        {contentNode}
      </Link>
    );
  }

  return (
    <div
      className="clipboard-popover-title"
      data-testid="popover-content"
    >
      {contentNode}
    </div>
  );
};

export default PopoverContent;
