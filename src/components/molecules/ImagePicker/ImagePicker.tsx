import Image from 'next/image';
import { useState } from 'react';

import Input from '@/components/atoms/Input/Input';

import styles from './ImagePicker.module.css';

interface ImagePickerProps {
  imageOptions?: string[];
  initialValue?: string;
}

export default function ImagePicker({
  imageOptions,
  initialValue,
}: ImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState<string>(
    initialValue ?? '',
  );

  return (
    <div className={styles.container}>
      <Input
        label="Image URL"
        name="imageUrl"
        id="imageUrl"
        type="url"
        value={selectedImage ?? ''}
        fullWidth
        onChange={(e) => setSelectedImage(e.target.value)}
        readOnly={!!imageOptions?.length}
      />
      {imageOptions && imageOptions.length > 0 && (
        <div className={styles.imageOptions}>
          {imageOptions.map((url, index) => (
            <button
              key={url}
              className={`${styles.imageContainer} ${selectedImage === url ? styles.selected : ''}`}
              onClick={() => setSelectedImage(url)}
              type="button"
            >
              <Image
                src={url}
                alt={`Recipe Image ${index}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                className={styles.image}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
