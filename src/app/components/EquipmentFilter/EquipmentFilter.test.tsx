import { fireEvent, render, screen } from '@testing-library/react';

import { renderInForm } from '../testUtils';
import EquipmentFilter from './EquipmentFilter';

const equipment = [
  { id: 'e1', name: 'Blender' },
  { id: 'e2', name: 'Dutch oven' },
  { id: 'e3', name: 'Whisk' },
];

const hiddenValue = (container: HTMLElement) =>
  (container.querySelector('input[name="equipment"]') as HTMLInputElement)
    .value;

const openPicker = (label = 'Equipment') =>
  fireEvent.click(screen.getByRole('button', { name: label }));

describe('EquipmentFilter', () => {
  it('shows a plain button label and an empty hidden input by default', () => {
    const { container } = renderInForm((formRef) => (
      <EquipmentFilter equipment={equipment} formRef={formRef} />
    ));

    expect(
      screen.getByRole('button', { name: 'Equipment' }),
    ).toBeInTheDocument();
    expect(hiddenValue(container)).toBe('');
  });

  it('shows the selected count and joins initial ids in the hidden input', () => {
    const { container } = renderInForm((formRef) => (
      <EquipmentFilter
        equipment={equipment}
        initialValue={['e1', 'e3']}
        formRef={formRef}
      />
    ));

    expect(
      screen.getByRole('button', { name: 'Equipment (2)' }),
    ).toBeInTheDocument();
    expect(hiddenValue(container)).toBe('e1,e3');
  });

  it('lists equipment in the picker and filters by search', () => {
    renderInForm((formRef) => (
      <EquipmentFilter equipment={equipment} formRef={formRef} />
    ));
    openPicker();

    expect(
      screen.getByRole('checkbox', { name: 'Blender' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Whisk' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search equipment'), {
      target: { value: 'dutch' },
    });

    expect(
      screen.queryByRole('checkbox', { name: 'Blender' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Dutch oven' }),
    ).toBeInTheDocument();
  });

  it('shows the no results text when nothing matches', () => {
    renderInForm((formRef) => (
      <EquipmentFilter equipment={equipment} formRef={formRef} />
    ));
    openPicker();

    fireEvent.change(screen.getByLabelText('Search equipment'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('No equipment found')).toBeInTheDocument();
  });

  it('toggles items on and off', () => {
    const { container } = renderInForm((formRef) => (
      <EquipmentFilter equipment={equipment} formRef={formRef} />
    ));
    openPicker();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Blender' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Whisk' }));

    expect(hiddenValue(container)).toBe('e1,e3');
    expect(
      screen.getByRole('button', { name: 'Equipment (2)' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Blender' }));
    expect(hiddenValue(container)).toBe('e3');
  });

  it('keeps the picker open after selecting (multi-select)', () => {
    renderInForm((formRef) => (
      <EquipmentFilter equipment={equipment} formRef={formRef} />
    ));
    openPicker();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Blender' }));

    expect(
      screen.getByRole('listbox', { name: 'Equipment picker' }),
    ).toBeInTheDocument();
  });

  it('reports whether the filter is active', () => {
    const update = jest.fn();
    renderInForm((formRef) => (
      <EquipmentFilter
        equipment={equipment}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    expect(update).toHaveBeenLastCalledWith('equipment', false);

    openPicker();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Blender' }));
    expect(update).toHaveBeenLastCalledWith('equipment', true);
  });

  it('clears the selection when the form is reset', () => {
    const update = jest.fn();
    const { container } = renderInForm((formRef) => (
      <EquipmentFilter
        equipment={equipment}
        initialValue={['e1', 'e2']}
        updateActiveFilters={update}
        formRef={formRef}
      />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(hiddenValue(container)).toBe('');
    expect(
      screen.getByRole('button', { name: 'Equipment' }),
    ).toBeInTheDocument();
    expect(update).toHaveBeenLastCalledWith('equipment', false);
  });

  it('works without an updateActiveFilters callback or formRef', () => {
    const { container } = render(<EquipmentFilter equipment={equipment} />);
    openPicker();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Blender' }));
    expect(hiddenValue(container)).toBe('e1');
  });
});
