import React, { useEffect, useState } from 'react';
import { SingleMediaEditor } from '@contentful/field-editor-reference';
import { Button, Pill } from '@contentful/f36-components';

function SJSingleMediaEditor({ sdk }) {
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    const unsubscribe = sdk.field.onValueChanged((value) => {
      if (value) {
        sdk.space.getAsset(value.sys.id).then((asset) => {
          setAsset(asset);
        });
      } else {
        setAsset(null);
      }
    });

    return function () {
      unsubscribe();
    };
  }, []);

  if (!asset) {
    return (
      <SingleMediaEditor
        sdk={sdk}
        viewType="card"
        parameters={{
          instance: {
            showCreateEntityAction: true,
            showLinkEntityAction: true,
          },
        }}
      />
    );
  }

  const file = asset.fields.file[sdk.field.locale];
  const { contentType } = file;

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: '0.5em' }}>
        <Pill label={contentType} />
        <Button
          size="small"
          variant="primary"
          onClick={() =>
            sdk.navigator.openAsset(asset.sys.id, { slideIn: true })
          }
          style={{
            marginLeft: 'auto',
          }}
        >
          Edit video
        </Button>
        <Button
          size="small"
          variant="negative"
          onClick={() => sdk.field.setValue(null)}
          style={{
            marginLeft: '0.5em',
          }}
        >
          Remove video
        </Button>
      </div>
      <video controls style={{ width: '100%' }}>
        <source src={file.url} type="video/mp4" />
        Sorry, your browser doesn't support embedded videos.
      </video>
    </div>
  );
}

export default SJSingleMediaEditor;
