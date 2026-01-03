import { ReactNode, useState } from 'react';

import Button from '@/components/Button/Button';
import Hint from '@/components/Hint/Hint';
import TextInput from '@/components/TextInput/TextInput';

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
    <div className={styles.container}>
      <h2>{title}</h2>
      {!hasProcessed ? (
        <>
          <Hint>
            Enter your {title.toLowerCase()} one per line. If a section applies,
            end it with a colon. We&apos;ll turn your list into editable rows so
            you can review, edit, and add to before saving.
          </Hint>
          <TextInput
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
    </div>
  );
}
