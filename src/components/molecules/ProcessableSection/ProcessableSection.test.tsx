import { fireEvent, render, screen } from '@testing-library/react';

import ProcessableSection from './ProcessableSection';

const editor = <div>Row editor</div>;

describe('ProcessableSection', () => {
  it('should start with the textarea when not initially processed', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
      />,
    );

    expect(screen.getByLabelText('All Ingredients')).toBeInTheDocument();
    expect(screen.queryByText('Row editor')).not.toBeInTheDocument();
  });

  it('should disable processing until text is entered', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Process Ingredients' }),
    ).toBeDisabled();
  });

  it('should call onProcess and show the editor after processing', () => {
    const onProcess = jest.fn();
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={onProcess}
        editorComponent={editor}
      />,
    );

    fireEvent.change(screen.getByLabelText('All Ingredients'), {
      target: { value: '1 cup flour' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Process Ingredients' }),
    );

    expect(onProcess).toHaveBeenCalledWith('1 cup flour');
    expect(screen.getByText('Row editor')).toBeInTheDocument();
  });

  it('should start on the editor when initialProcessed is true', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
        initialProcessed
      />,
    );

    expect(screen.getByText('Row editor')).toBeInTheDocument();
  });

  it('should not offer Edit as Text without getText', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
        initialProcessed
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Edit as Text' }),
    ).not.toBeInTheDocument();
  });

  it('should fill the textarea from getText and show the warning', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
        initialProcessed
        getText={() => '1 cup flour'}
        reprocessWarning="This resets things."
      />,
    );

    expect(screen.queryByText('This resets things.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit as Text' }));
    expect(screen.getByLabelText('All Ingredients')).toHaveValue('1 cup flour');
    expect(screen.getByText('This resets things.')).toBeInTheDocument();
    expect(screen.queryByText('Row editor')).not.toBeInTheDocument();
  });

  it('should return to the editor on Cancel without processing', () => {
    const onProcess = jest.fn();
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={onProcess}
        editorComponent={editor}
        initialProcessed
        getText={() => '1 cup flour'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit as Text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onProcess).not.toHaveBeenCalled();
    expect(screen.getByText('Row editor')).toBeInTheDocument();
  });

  it('should process edited text after Edit as Text', () => {
    const onProcess = jest.fn();
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={onProcess}
        editorComponent={editor}
        initialProcessed
        getText={() => '1 cup flour'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit as Text' }));
    fireEvent.change(screen.getByLabelText('All Ingredients'), {
      target: { value: '2 cups flour' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Process Ingredients' }),
    );

    expect(onProcess).toHaveBeenCalledWith('2 cups flour');
  });

  it('should not show Cancel on the first entry', () => {
    render(
      <ProcessableSection
        title="Ingredients"
        onProcess={jest.fn()}
        editorComponent={editor}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });
});
