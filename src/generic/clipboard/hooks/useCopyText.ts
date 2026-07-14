import { useIntl } from '@edx/frontend-platform/i18n';
import { useCallback, useContext } from 'react';

import { ToastContext } from '../../toast-context';
import copyText from '../copyText';
import messages from './messages';

const useCopyText = () => {
  const intl = useIntl();
  const { showToast } = useContext(ToastContext);

  return useCallback(async (value: string) => {
    try {
      await copyText(value);
      showToast(intl.formatMessage(messages.done));
    } catch (error) {
      showToast(intl.formatMessage(messages.error));
    }
  }, [intl, showToast]);
};

export default useCopyText;
