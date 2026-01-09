export function getStringSearchParam(
  searchParams: URLSearchParams,
  paramName: string,
): string {
  const paramValue = searchParams.get(paramName);
  return typeof paramValue === 'string' ? paramValue : '';
}

export function getStringArraySearchParam(
  searchParams: URLSearchParams,
  paramName: string,
): string[] {
  const paramValue = searchParams.get(paramName);
  return paramValue ? paramValue.split(',') : [];
}

export function getNumberSearchParam(
  searchParams: URLSearchParams,
  paramName: string,
): number | null {
  const paramValue = searchParams.get(paramName);
  return paramValue ? parseInt(paramValue, 10) : null;
}
