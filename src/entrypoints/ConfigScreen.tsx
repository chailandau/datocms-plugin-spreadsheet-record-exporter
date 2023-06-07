import { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import { Button, Canvas, Spinner } from 'datocms-react-ui';
import { useState } from 'react';

import downloadRecords from '../utils/downloadRecords';

import s from './styles.module.scss';

type Props = {
  ctx: RenderConfigScreenCtx;
};

export default function ConfigScreen({ ctx }: Props) {
  const [isLoading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRecords = async () => {
    setLoading(true);
    setProgress(0);

    await downloadRecords({
      apiToken: ctx.currentUserAccessToken as string,
      progressCallback: (count: number) => {
        setProgress(count);
      }
    });

    setLoading(false);
  };

  return (
    <Canvas ctx={ctx}>

      <Button fullWidth
        className={s.buttonItem}
        onClick={handleRecords}
        disabled={isLoading}
      >
        Download project records
      </Button>

      <div className={`${s.loading_message} ${!isLoading ? s.hidden : ''}`}>
        <div className={s.spinner}>
          <Spinner size={48} placement="centered" />
        </div>
        <p><strong>Finding records to download.</strong></p>

        <p><em>This can take a few minutes, please do not reload or exit the page.</em></p>
      </div>

      <p>Records found: {progress}</p>

    </Canvas>
  );
}
