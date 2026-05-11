import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  IconButton,
  Icon,
} from '@openedx/paragon';
import { MoreHoriz } from '@openedx/paragon/icons';
import messages from './messages';

const MENU_WIDTH = 248;
const MENU_VERTICAL_OFFSET = 8;
const MENU_VIEWPORT_MARGIN = 16;
const ESTIMATED_MENU_HEIGHT = 316;

const FileMenu = ({
  externalUrl,
  handleLock,
  locked,
  onDownload,
  openAssetInfo,
  openDeleteConfirmation,
  portableUrl,
  id,
  fileType,
}) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const left = Math.min(
      Math.max(MENU_VIEWPORT_MARGIN, triggerRect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - MENU_VIEWPORT_MARGIN,
    );
    const hasSpaceBelow = triggerRect.bottom + MENU_VERTICAL_OFFSET + ESTIMATED_MENU_HEIGHT
      < window.innerHeight - MENU_VIEWPORT_MARGIN;
    const top = hasSpaceBelow
      ? triggerRect.bottom + MENU_VERTICAL_OFFSET
      : Math.max(
        MENU_VIEWPORT_MARGIN,
        triggerRect.top - MENU_VERTICAL_OFFSET - ESTIMATED_MENU_HEIGHT,
      );

    setMenuPosition({ top, left });
  }, []);

  const handleTriggerClick = () => {
    if (isOpen) {
      closeMenu();
      return;
    }
    positionMenu();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target)
        || menuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleLayoutChange = () => positionMenu();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [closeMenu, isOpen, positionMenu]);

  const renderMenuItem = ({
    children,
    onClick,
    testId,
    isDanger,
  }) => (
    <button
      className={`dropdown-item${isDanger ? ' is-danger' : ''}`}
      data-testid={testId}
      type="button"
      onClick={() => {
        onClick();
        closeMenu();
      }}
    >
      {children}
    </button>
  );

  const menu = (
    <div
      ref={menuRef}
      className="file-actions-portal-menu"
      data-testid={`file-actions-menu-${id}`}
      role="menu"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        width: `${MENU_WIDTH}px`,
      }}
    >
      {fileType === 'video' ? (
        renderMenuItem({
          children: intl.formatMessage(messages.copyVideoIdTitle),
          onClick: () => navigator.clipboard.writeText(id),
        })
      ) : (
        <>
          {renderMenuItem({
            children: intl.formatMessage(messages.copyStudioUrlTitle),
            onClick: () => navigator.clipboard.writeText(portableUrl),
          })}
          {renderMenuItem({
            children: intl.formatMessage(messages.copyWebUrlTitle),
            onClick: () => navigator.clipboard.writeText(externalUrl),
          })}
          {renderMenuItem({
            children: locked
              ? intl.formatMessage(messages.unlockMenuTitle)
              : intl.formatMessage(messages.lockMenuTitle),
            onClick: handleLock,
          })}
        </>
      )}
      {renderMenuItem({
        children: intl.formatMessage(messages.downloadTitle),
        onClick: onDownload,
      })}
      {renderMenuItem({
        children: intl.formatMessage(messages.infoTitle),
        onClick: openAssetInfo,
      })}
      <div className="dropdown-divider" role="separator" />
      {renderMenuItem({
        children: intl.formatMessage(messages.deleteTitle),
        onClick: openDeleteConfirmation,
        testId: 'open-delete-confirmation-button',
        isDanger: true,
      })}
    </div>
  );

  return (
    <div ref={triggerRef} className="file-menu-dropdown" data-testid={`file-menu-dropdown-${id}`}>
      <IconButton
        id={`file-menu-dropdown-${id}`}
        src={MoreHoriz}
        iconAs={Icon}
        variant="primary"
        alt="file-menu-toggle"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={handleTriggerClick}
      />
      {isOpen && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

FileMenu.propTypes = {
  externalUrl: PropTypes.string,
  handleLock: PropTypes.func,
  locked: PropTypes.bool,
  onDownload: PropTypes.func.isRequired,
  openAssetInfo: PropTypes.func.isRequired,
  openDeleteConfirmation: PropTypes.func.isRequired,
  portableUrl: PropTypes.string,
  id: PropTypes.string.isRequired,
  fileType: PropTypes.string.isRequired,
};

FileMenu.defaultProps = {
  externalUrl: null,
  handleLock: null,
  locked: null,
  portableUrl: null,
};

export default FileMenu;
