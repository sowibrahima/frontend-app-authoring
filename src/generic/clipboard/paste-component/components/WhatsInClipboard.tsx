import { useRef } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Icon } from '@openedx/paragon';
import { Question as QuestionIcon } from '@openedx/paragon/icons';

import messages from '../messages';

interface WhatsInClipboardProps {
  handlePopoverToggle: (show: boolean) => void;
  togglePopover: (show: boolean) => void;
  popoverElementRef: React.RefObject<HTMLDivElement>;
}

const WhatsInClipboard = ({
  handlePopoverToggle,
  togglePopover,
  popoverElementRef,
}: WhatsInClipboardProps) => {
  const intl = useIntl();
  const triggerElementRef = useRef(null);

  const handleKeyDown = ({ key }) => {
    if (key === 'Tab') {
      popoverElementRef.current?.focus();
      handlePopoverToggle(true);
    }
  };

  return (
    <button
      type="button"
      className="whats-in-clipboard"
      data-testid="whats-in-clipboard"
      onMouseEnter={() => handlePopoverToggle(true)}
      onMouseLeave={() => handlePopoverToggle(false)}
      onFocus={() => togglePopover(true)}
      onBlur={() => togglePopover(false)}
      onKeyDown={handleKeyDown}
      ref={triggerElementRef}
    >
      <Icon
        className="whats-in-clipboard-icon"
        src={QuestionIcon}
      />
      <span className="whats-in-clipboard-text">
        {intl.formatMessage(messages.pasteButtonWhatsInClipboardText)}
      </span>
    </button>
  );
};

export default WhatsInClipboard;
