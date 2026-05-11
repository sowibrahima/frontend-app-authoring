import { useRef, useState } from 'react';
import { OverlayTrigger, Popover } from '@openedx/paragon';

import { PopoverContent, PasteButton, WhatsInClipboard } from './components';
import type { ClipboardStatus } from '../../data/api';

interface PasteComponentProps {
  onClick: () => void;
  clipboardData: ClipboardStatus;
  text: string;
  className?: string;
}

const PasteComponent = ({
  onClick, clipboardData, text, className,
}: PasteComponentProps) => {
  const [showPopover, togglePopover] = useState(false);
  const popoverElementRef = useRef<HTMLDivElement>(null);

  const handlePopoverToggle = (isOpen: boolean) => togglePopover(isOpen);

  const renderPopover = (props) => (
    <Popover
      className="clipboard-popover"
      id="clipboard-popover"
      ref={popoverElementRef}
      tabIndex={0}
      onMouseEnter={() => handlePopoverToggle(true)}
      onMouseLeave={() => handlePopoverToggle(false)}
      onFocus={() => handlePopoverToggle(true)}
      onBlur={() => handlePopoverToggle(false)}
      {...props}
    >
      <PopoverContent clipboardData={clipboardData} />
    </Popover>
  );

  return (
    <div className="paste-component">
      <PasteButton className={className} onClick={onClick} text={text} />
      <OverlayTrigger
        placement="top"
        show={showPopover}
        overlay={renderPopover}
      >
        <WhatsInClipboard
          handlePopoverToggle={handlePopoverToggle}
          togglePopover={togglePopover}
          popoverElementRef={popoverElementRef}
        />
      </OverlayTrigger>
    </div>
  );
};

export default PasteComponent;
