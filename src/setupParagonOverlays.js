import { ModalPopup } from '@openedx/paragon';

const viewportAwarePopupModifiers = [
  {
    name: 'eventListeners',
    options: { scroll: true, resize: true },
  },
  {
    name: 'offset',
    options: { offset: [0, 10] },
  },
  {
    name: 'flip',
    options: { padding: 12, rootBoundary: 'viewport' },
  },
  {
    name: 'preventOverflow',
    options: {
      altAxis: true,
      padding: 12,
      rootBoundary: 'viewport',
      tether: false,
    },
  },
];

ModalPopup.defaultProps = {
  ...ModalPopup.defaultProps,
  withPortal: true,
  strategy: 'fixed',
  modifiers: viewportAwarePopupModifiers,
};
