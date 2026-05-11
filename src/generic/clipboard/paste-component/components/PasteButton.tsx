import { Button } from '@openedx/paragon';
import { ContentCopy as ContentCopyIcon } from '@openedx/paragon/icons';

interface PasteButtonProps {
  onClick: () => void;
  text: string;
  className?: string;
}

const PasteButton = ({ onClick, text, className }: PasteButtonProps) => (
  <Button
    className={`paste-component__button ${className || ''}`.trim()}
    iconBefore={ContentCopyIcon}
    variant="outline-primary"
    onClick={onClick}
  >
    {text}
  </Button>
);

export default PasteButton;
