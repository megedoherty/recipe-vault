import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  InstructionSection,
  RecipeIngredientDisplay,
  RecipeIngredientSections,
} from '@/types';

import {
  ServingsProvider,
  useServings,
} from '../ServingsContext/ServingsContext';
import IngredientsAndInstructionsSection from './IngredientsAndInstructionsSection';

const ingredient = (
  id: string,
  name: string,
  quantity: string | null,
): RecipeIngredientDisplay => ({
  id,
  name,
  quantity,
  normalizedIngredientId: null,
  normalizedIngredientName: null,
  category: 'Other',
});

const flour = ingredient('1', 'flour', '2 cups');
const eggs = ingredient('2', 'eggs', '2');
const sugar = ingredient('3', 'sugar', '1 cup');

const sections: RecipeIngredientSections[] = [
  { id: 'sec1', title: '', ingredients: [flour, eggs] },
  { id: 'sec2', title: 'Frosting', ingredients: [sugar] },
];
const ingredientMap = { '1': flour, '2': eggs, '3': sugar };

const instructions: InstructionSection[] = [
  {
    id: 's1',
    title: null,
    steps: [
      { id: 'a', text: 'Mix dry', ingredientIds: ['1'] },
      { id: 'b', text: 'Add eggs', ingredientIds: ['2'] },
      { id: 'c', text: 'Make frosting', ingredientIds: ['3'] },
    ],
  },
];

function SetServings({ to }: { to: number }) {
  const { setServings } = useServings();
  return <button onClick={() => setServings(to)}>set servings</button>;
}

const renderSection = (base: number | null = null, extra?: React.ReactNode) =>
  render(
    <ServingsProvider baseServings={base}>
      {extra}
      <IngredientsAndInstructionsSection
        ingredientSections={sections}
        instructions={instructions}
        ingredientMap={ingredientMap}
        containerClassName="custom"
      />
    </ServingsProvider>,
  );

const step = (name: RegExp) =>
  screen.getByRole('button', { name }).closest('li')!;

describe('IngredientsAndInstructionsSection', () => {
  it('renders ingredient sections, with headings only for titled ones', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Ingredients' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Frosting' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '2 cups flour' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: '1 cup sugar' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('renders the instructions', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Instructions' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mix dry/ })).toBeInTheDocument();
  });

  it('applies the container class name', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Ingredients' }).parentElement,
    ).toHaveClass('custom');
  });

  it('marks no step as selected or done initially, and highlights nothing', () => {
    renderSection();

    // No active step yet, so no step is selected or done
    for (const name of [/Mix dry/, /Add eggs/, /Make frosting/]) {
      expect(step(name)).not.toHaveClass('selected');
      expect(step(name)).not.toHaveClass('done');
    }
  });

  it('selects the clicked step, marks earlier ones done, and highlights its ingredients', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: /Add eggs/ }));

    expect(step(/Mix dry/)).toHaveClass('done');
    expect(step(/Add eggs/)).toHaveClass('selected');
    expect(step(/Make frosting/)).not.toHaveClass('selected');
    expect(step(/Make frosting/)).not.toHaveClass('done');

    const eggItem = screen
      .getByRole('checkbox', { name: '2 eggs' })
      .closest('li')!;
    const flourItem = screen
      .getByRole('checkbox', { name: '2 cups flour' })
      .closest('li')!;
    expect(eggItem.querySelector('.selected')).not.toBeNull();
    expect(flourItem.querySelector('.selected')).toBeNull();
  });

  describe('scaling', () => {
    it('scales ingredient quantities and step ingredient text', () => {
      renderSection(2, <SetServings to={4} />);

      fireEvent.click(screen.getByRole('button', { name: 'set servings' }));

      expect(
        screen.getByRole('checkbox', { name: '4 cups flour' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: '2 cups sugar' }),
      ).toBeInTheDocument();
      expect(
        within(step(/Mix dry/)).getByText('4 cups flour'),
      ).toBeInTheDocument();
    });

    it('leaves quantities alone when the recipe cannot scale', () => {
      renderSection(null);

      expect(
        screen.getByRole('checkbox', { name: '2 cups flour' }),
      ).toBeInTheDocument();
      expect(
        within(step(/Mix dry/)).getByText('2 cups flour'),
      ).toBeInTheDocument();
    });
  });

  describe('scrolling the ingredients panel', () => {
    const panelRect = { top: 100, bottom: 200 } as DOMRect;
    let rects: Record<string, Partial<DOMRect>>;

    beforeEach(() => {
      rects = {};
      jest
        .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
        .mockReturnValue(500);
      jest
        .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
        .mockReturnValue(100);
      jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: Element) {
          if (this.classList.contains('scroller')) return panelRect;
          const label = this.textContent ?? '';
          return (rects[label] ?? { top: 100, bottom: 120 }) as DOMRect;
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const panel = () =>
      screen.getByRole('heading', { name: 'Ingredients' }).parentElement!;

    it('scrolls up when the active ingredient is above the panel', () => {
      renderSection();
      rects['2 cups flour'] = { top: 60, bottom: 80 };

      fireEvent.click(screen.getByRole('button', { name: /Mix dry/ }));

      expect(panel().scrollTop).toBe(-40);
    });

    it('scrolls down when the active ingredient is below the panel', () => {
      renderSection();
      rects['2 eggs'] = { top: 190, bottom: 230 };

      fireEvent.click(screen.getByRole('button', { name: /Add eggs/ }));

      // Scrolls by the overflow (30), capped so the item's top stays visible
      expect(panel().scrollTop).toBe(30);
    });

    it('does not scroll when the active ingredient is already visible', () => {
      renderSection();

      fireEvent.click(screen.getByRole('button', { name: /Mix dry/ }));

      expect(panel().scrollTop).toBe(0);
    });

    it('does not scroll when the panel fits its content', () => {
      jest
        .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
        .mockReturnValue(100);
      renderSection();
      rects['2 cups flour'] = { top: 60, bottom: 80 };

      fireEvent.click(screen.getByRole('button', { name: /Mix dry/ }));

      expect(panel().scrollTop).toBe(0);
    });
  });
});
