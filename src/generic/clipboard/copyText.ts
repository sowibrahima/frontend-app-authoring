/**
 * Copy plain text in both secure production contexts and HTTP Tutor
 * development environments. The async Clipboard API is only guaranteed in a
 * secure context, so retain the textarea fallback for local deployments.
 */
export const copyText = async (value: string): Promise<void> => {
  if (!value) {
    throw new Error('No text supplied for clipboard copy');
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch (error) {
    // Continue with the HTTP-compatible fallback below.
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Browser rejected clipboard copy');
  }
};

export default copyText;
