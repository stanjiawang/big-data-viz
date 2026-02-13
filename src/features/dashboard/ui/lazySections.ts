import { lazy } from 'react';

export const SummarySection = lazy(async () => {
  const module = await import('@/features/dashboard/sections/SummarySection');
  return { default: module.SummarySection };
});

export const ChartsSection = lazy(async () => {
  const module = await import('@/features/dashboard/sections/ChartsSection');
  return { default: module.ChartsSection };
});

export const TableSection = lazy(async () => {
  const module = await import('@/features/dashboard/sections/TableSection');
  return { default: module.TableSection };
});
