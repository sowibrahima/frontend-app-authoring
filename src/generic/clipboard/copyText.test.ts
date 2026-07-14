import { copyText } from './copyText';

describe('copyText', () => {
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
    document.execCommand = originalExecCommand;
    document.querySelectorAll('textarea').forEach(element => element.remove());
    jest.restoreAllMocks();
  });

  it('uses the async Clipboard API when it is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    document.execCommand = jest.fn();

    await copyText('https://example.test/file.pdf');

    expect(writeText).toHaveBeenCalledWith('https://example.test/file.pdf');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the Clipboard API is unavailable over HTTP', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    document.execCommand = jest.fn().mockReturnValue(true);

    await copyText('http://apps.teak.local.openedx.io/file.pdf');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('uses the fallback when the Clipboard API rejects', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    document.execCommand = jest.fn().mockReturnValue(true);

    await expect(copyText('http://apps.teak.local.openedx.io/file.pdf')).resolves.toBeUndefined();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('rejects when neither clipboard path succeeds', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    document.execCommand = jest.fn().mockReturnValue(false);

    await expect(copyText('copy me')).rejects.toThrow('Browser rejected clipboard copy');
  });
});
