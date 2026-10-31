import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Tabs from './Tabs';

const tabs = [
  { id: 'a', label: 'Alpha', content: <p>Alpha content</p> },
  { id: 'b', label: 'Beta', content: <p>Beta content</p> },
  { id: 'c', label: 'Gamma', content: <p>Gamma content</p> },
];

const renderTabs = (defaultTabId?: string) =>
  render(<Tabs label="Test tabs" tabs={tabs} defaultTabId={defaultTabId} />);

describe('Tabs', () => {
  it('renders a labelled tablist with the first tab selected by default', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByText('Alpha content')).toBeInTheDocument();
    expect(screen.queryByText('Beta content')).not.toBeInTheDocument();
  });

  it('selects defaultTabId when given', () => {
    renderTabs('b');

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Beta content')).toBeInTheDocument();
  });

  it('only makes the active tab tabbable', () => {
    renderTabs('b');

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('renders content in a tabpanel linked to the active tab', () => {
    renderTabs('b');

    const tab = screen.getByRole('tab', { name: 'Beta' });
    const panel = screen.getByRole('tabpanel', { name: 'Beta' });
    expect(panel).toHaveTextContent('Beta content');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
  });

  it('switches panels when a tab is clicked', () => {
    renderTabs();

    fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }));

    expect(screen.getByText('Gamma content')).toBeInTheDocument();
    expect(screen.queryByText('Alpha content')).not.toBeInTheDocument();
  });

  it('moves with arrow keys, wrapping around, and Home/End', () => {
    renderTabs();
    const selected = () =>
      screen
        .getAllByRole('tab')
        .find((tab) => tab.getAttribute('aria-selected') === 'true');

    fireEvent.keyDown(selected()!, { key: 'ArrowLeft' });
    expect(selected()).toHaveTextContent('Gamma');

    fireEvent.keyDown(selected()!, { key: 'ArrowRight' });
    expect(selected()).toHaveTextContent('Alpha');

    fireEvent.keyDown(selected()!, { key: 'End' });
    expect(selected()).toHaveTextContent('Gamma');

    fireEvent.keyDown(selected()!, { key: 'Home' });
    expect(selected()).toHaveTextContent('Alpha');
  });

  it('ignores other keys', () => {
    renderTabs();

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Alpha' }), {
      key: 'Enter',
    });

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('does not reuse state between tabs that render the same component', () => {
    const Stateful = ({ initial }: { initial: string }) => {
      const [value] = useState(initial);
      return <p>{value}</p>;
    };

    render(
      <Tabs
        label="Test tabs"
        tabs={[
          { id: 'a', label: 'Alpha', content: <Stateful initial="from A" /> },
          { id: 'b', label: 'Beta', content: <Stateful initial="from B" /> },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(screen.getByText('from B')).toBeInTheDocument();
  });
});
