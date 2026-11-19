import { fireEvent, render, screen } from '@testing-library/react';

import { InstructionSection } from '@/types';

import InstructionsSection from './InstructionsSection';

const instructions: InstructionSection[] = [
  {
    id: 's1',
    title: null,
    steps: [{ id: 'a', text: 'Mix everything' }],
  },
  {
    id: 's2',
    title: 'Frosting',
    steps: [
      { id: 'b', text: 'Beat the butter' },
      { id: 'c', text: 'Add sugar' },
    ],
  },
];

describe('InstructionsSection', () => {
  it('renders nothing without instructions', () => {
    const { container } = render(
      <InstructionsSection
        instructions={null}
        ingredientMap={{}}
        updateActiveStep={jest.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders every step, with headings only for titled sections', () => {
    render(
      <InstructionsSection
        instructions={instructions}
        ingredientMap={{}}
        updateActiveStep={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Instructions' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Frosting' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('reports the clicked step', () => {
    const updateActiveStep = jest.fn();
    render(
      <InstructionsSection
        instructions={instructions}
        ingredientMap={{}}
        updateActiveStep={updateActiveStep}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Add sugar/ }));

    expect(updateActiveStep).toHaveBeenCalledWith({
      id: 'c',
      text: 'Add sugar',
    });
  });

  it('passes the step status through to each step', () => {
    render(
      <InstructionsSection
        instructions={instructions}
        ingredientMap={{}}
        updateActiveStep={jest.fn()}
        getStepStatus={(id) => (id === 'b' ? 'selected' : undefined)}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveClass('selected');
    expect(items[0]).not.toHaveClass('selected');
  });
});
