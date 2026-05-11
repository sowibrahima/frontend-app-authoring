import React, { useEffect, useRef, useState } from 'react';
import {
  ActionRow,
  Button,
  Form,
  ModalDialog,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';

interface CreateItemNameModalProps {
  isOpen: boolean;
  itemType: string;
  onClose: () => void;
  onSubmit: (displayName: string) => void;
}

const CreateItemNameModal = ({
  isOpen,
  itemType,
  onClose,
  onSubmit,
}: CreateItemNameModalProps) => {
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const trimmedDisplayName = displayName.trim();
  const isInvalid = wasSubmitted && !trimmedDisplayName;
  const requiredMessage = intl.formatMessage(messages.createItemNameModalRequired, { itemType });

  useEffect(() => {
    if (!isOpen) {
      setDisplayName('');
      setWasSubmitted(false);
      return;
    }

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setWasSubmitted(true);

    if (!trimmedDisplayName) {
      return;
    }

    onSubmit(trimmedDisplayName);
  };

  return (
    <ModalDialog
      title={intl.formatMessage(messages.createItemNameModalTitle, { itemType })}
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      isFullscreenOnMobile
      isOverflowVisible={false}
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          {intl.formatMessage(messages.createItemNameModalTitle, { itemType })}
        </ModalDialog.Title>
      </ModalDialog.Header>
      <Form onSubmit={handleSubmit}>
        <ModalDialog.Body className="mw-sm">
          <Form.Group controlId="course-outline-create-item-name">
            <Form.Label className="font-weight-bold">
              {intl.formatMessage(messages.createItemNameModalLabel, { itemType })}
            </Form.Label>
            <Form.Control
              ref={inputRef}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              isInvalid={isInvalid}
              placeholder={intl.formatMessage(messages.createItemNameModalPlaceholder)}
              aria-describedby={isInvalid ? 'course-outline-create-item-name-error' : undefined}
            />
            {isInvalid && (
              <Form.Control.Feedback
                id="course-outline-create-item-name-error"
                type="invalid"
                hasIcon={false}
              >
                {requiredMessage}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="tertiary">
              {intl.formatMessage(messages.createItemNameModalCancel)}
            </ModalDialog.CloseButton>
            <Button
              type="submit"
              variant="primary"
              disabled={wasSubmitted && !trimmedDisplayName}
            >
              {intl.formatMessage(messages.createItemNameModalCreate)}
            </Button>
          </ActionRow>
        </ModalDialog.Footer>
      </Form>
    </ModalDialog>
  );
};

export default CreateItemNameModal;
