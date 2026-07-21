import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Button,
  Stack,
} from '@openedx/paragon';
import {
  Edit as EditIcon,
  FindInPage,
} from '@openedx/paragon/icons';
import { COURSE_BLOCK_NAMES } from '@src/constants';

import messages from './messages';

export type HeaderNavigationActions = {
  handleViewLive: () => void;
  handlePreview: () => void;
  handleEdit: () => void;
};

type HeaderNavigationsProps = {
  headerNavigationsActions: HeaderNavigationActions;
  category: string;
  isPublished?: boolean;
};

/**
 * Generic header navigations to be used in this pages:
 * - Unit page
 * - Legacy library content page
 * - Split test page
 */
const HeaderNavigations = ({
  headerNavigationsActions,
  category,
  isPublished = true,
}: HeaderNavigationsProps) => {
  const intl = useIntl();
  const {
    handleViewLive,
    handlePreview,
    handleEdit,
  } = headerNavigationsActions;

  return (
    <nav className="header-navigations ml-auto flex-shrink-0">
      {
        /**
         * Action buttons used in the unit page
         */
      }
      {category === COURSE_BLOCK_NAMES.vertical.id && (
        <Stack direction="horizontal" gap={3}>
          <Button
            variant="outline-primary"
            onClick={handlePreview}
            iconBefore={FindInPage}
          >
            {intl.formatMessage(messages.previewButton)}
          </Button>
          {/* TODO: convert to <Button as="a" href="..."> since it navigates to a URL */}
          <Button
            variant="outline-primary"
            onClick={handleViewLive}
            disabled={!isPublished}
          >
            {intl.formatMessage(messages.viewLiveButton)}
          </Button>
        </Stack>
      )}
      {
        /**
         * Action buttons used in legacy libraries content page and split test page
         */
      }
      {[COURSE_BLOCK_NAMES.libraryContent.id, COURSE_BLOCK_NAMES.splitTest.id].includes(category) && (
        <Button
          iconBefore={EditIcon}
          variant="outline-primary"
          onClick={handleEdit}
          data-testid="header-edit-button"
        >
          {intl.formatMessage(messages.editButton)}
        </Button>
      )}
    </nav>
  );
};

export default HeaderNavigations;
