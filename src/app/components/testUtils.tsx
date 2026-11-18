import { render } from '@testing-library/react';
import { ReactElement, RefObject, useRef } from 'react';

type FormRef = RefObject<HTMLFormElement | null>;
type RenderUi = (formRef: FormRef) => ReactElement;

// Filters listen for their parent form's `reset` event, so they need a real
// form and a ref to it. This renders `ui` inside one, along with a
// "Reset" button (type="reset") to trigger that event.
function FormHarness({ ui }: { ui: RenderUi }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef}>
      {ui(formRef)}
      <button type="reset">Reset</button>
    </form>
  );
}

export function renderInForm(ui: RenderUi) {
  const result = render(<FormHarness ui={ui} />);
  return {
    ...result,
    rerender: (nextUi: RenderUi) =>
      result.rerender(<FormHarness ui={nextUi} />),
  };
}
