export const withMinimalResponse = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}response=minimal`;
};
