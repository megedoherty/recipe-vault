import { ReactNode, useState } from 'react';

import Button from '@/components/atoms/Button/Button';
import Hint from '@/components/atoms/Hint/Hint';
import Input from '@/components/atoms/Input/Input';

import styles from './ProcessableSection.module.css';

interface ProcessableSectionProps {
  title: string;
  onProcess: (inputValue: string) => void;
  editorComponent: ReactNode;
}

export default function ProcessableSection({
  title,
  onProcess,
  editorComponent,
}: ProcessableSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);

  const onProcessClick = () => {
    onProcess(inputValue);
    setHasProcessed(true);
  };

  return (
    <section className={styles.container}>
      <h2>{title}</h2>
      {!hasProcessed ? (
        <>
          <Hint>
            Enter your {title.toLowerCase()} one per line. If a section applies,
            end it with a colon. We&apos;ll turn your list into editable rows so
            you can review, edit, and add to before saving.
          </Hint>
          <Input
            label={`All ${title}`}
            name="ingredients"
            id="ingredients"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            type="textarea"
            fullWidth
          />
          <Button
            size="small"
            onClick={onProcessClick}
            disabled={inputValue.trim() === ''}
          >
            Process {title}
          </Button>
        </>
      ) : (
        editorComponent
      )}
    </section>
  );
}
