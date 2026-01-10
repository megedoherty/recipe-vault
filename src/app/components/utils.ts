import { FormEvent } from 'react';

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

export function generateQueryString(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);

  const params = new URLSearchParams();

  const nameValue = formData.get('name') as string;
  if (nameValue?.trim()) {
    params.set('name', nameValue.trim());
  }

  const categoryValue = formData.get('categoryId') as string;
  if (categoryValue) {
    params.set('categoryId', categoryValue);
  }

  const includeValue = formData.get('includeIngredients') as string;
  if (includeValue) {
    params.set('includeIngredients', includeValue);
  }

  const excludeValue = formData.get('excludeIngredients') as string;
  if (excludeValue) {
    params.set('excludeIngredients', excludeValue);
  }

  const equipmentValue = formData.get('equipment') as string;
  if (equipmentValue) {
    params.set('equipment', equipmentValue);
  }

  const minServingsValue = formData.get('minServings') as string;
  const maxServingsValue = formData.get('maxServings') as string;

  const minNum = minServingsValue ? Number(minServingsValue) : undefined;
  const maxNum = maxServingsValue ? Number(maxServingsValue) : undefined;

  const isValid =
    minNum === undefined ||
    maxNum === undefined ||
    (!isNaN(minNum) && !isNaN(maxNum) && minNum <= maxNum);

  if (isValid && minServingsValue) {
    params.set('minServings', minServingsValue);
  }

  if (isValid && maxServingsValue) {
    params.set('maxServings', maxServingsValue);
  }

  const madeValue = formData.get('made') as string;
  if (madeValue === 'yes') {
    params.set('made', 'true');
  } else if (madeValue === 'no') {
    params.set('made', 'false');
  }

  return params.toString();
}
