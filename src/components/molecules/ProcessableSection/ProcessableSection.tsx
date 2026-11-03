import { ReactNode, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Hint from '@/components/atoms/Hint/Hint';
import Input from '@/components/atoms/Input/Input';

import styles from './ProcessableSection.module.css';

interface ProcessableSectionProps {
  title: string;
  onProcess: (inputValue: string) => void;
  editorComponent: ReactNode;
  // Start in the editor view (e.g. the data was already parsed from a URL)
  initialProcessed?: boolean;
  // Serializes the current editor state back to text for mass editing
  getText?: () => string;
  // Shown when editing as text, to say what re-processing will reset
  reprocessWarning?: string;
}

export default function ProcessableSection({
  title,
  onProcess,
  editorComponent,
  initialProcessed = false,
  getText,
  reprocessWarning,
}: ProcessableSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [hasProcessed, setHasProcessed] = useState(initialProcessed);
  const [canCancel, setCanCancel] = useState(false);

  const onProcessClick = () => {
    onProcess(inputValue);
    setHasProcessed(true);
  };

  const onEditAsTextClick = () => {
    setInputValue(getText?.() ?? '');
    setCanCancel(true);
    setHasProcessed(false);
  };

  const fieldName = title.toLowerCase();

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {hasProcessed && getText && (
          <Button size="small" variant="secondary" onClick={onEditAsTextClick}>
            Edit as Text
          </Button>
        )}
      </div>
      {!hasProcessed ? (
        <>
          <Hint>
            Enter your {fieldName} one per line. If a section applies, end it
            with a colon. We&apos;ll turn your list into editable rows so you
            can review, edit, and add to before saving.
          </Hint>
          {canCancel && reprocessWarning && <Hint>{reprocessWarning}</Hint>}
          <Input
            label={`All ${title}`}
            name={fieldName}
            id={fieldName}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            type="textarea"
            fullWidth
          />
          <div className={styles.actions}>
            <Button
              size="small"
              onClick={onProcessClick}
              disabled={inputValue.trim() === ''}
            >
              Process {title}
            </Button>
            {canCancel && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => setHasProcessed(true)}
              >
                Cancel
              </Button>
            )}
          </div>
        </>
      ) : (
        editorComponent
      )}
    </section>
  );
}
