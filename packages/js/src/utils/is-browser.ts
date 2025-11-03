export function isBrowser() {
  return typeof window !== 'undefined';
}

export function isReactNative() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.product === 'string' &&
    navigator.product.toLowerCase() === 'reactnative'
  );
}
