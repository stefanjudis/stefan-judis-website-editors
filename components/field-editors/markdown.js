import React, { useEffect, useState } from 'react';
import { MarkdownEditor } from '@contentful/field-editor-markdown';
import { Button } from '@contentful/f36-components';
import 'codemirror/lib/codemirror.css';

const TEMPLATE_URL = 'https://www.stefanjudis.com/web-weekly/template.txt';

function SJMarkdown({ sdk }) {
  const [isEmpty, setIsEmpty] = useState(!sdk.field.getValue());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return sdk.field.onValueChanged((value) => setIsEmpty(!value));
  }, []);

  const insertTemplate = async () => {
    if (sdk.field.getValue()) return;

    setIsLoading(true);
    try {
      const response = await fetch(TEMPLATE_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const template = await response.text();
      await sdk.field.setValue(template);
    } catch (error) {
      sdk.notifier.error(`Could not load template: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isEmpty && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '0.5em',
          }}
        >
          <Button
            size="small"
            variant="primary"
            onClick={insertTemplate}
            isLoading={isLoading}
            isDisabled={isLoading}
            style={{ marginLeft: 'auto' }}
          >
            Insert newsletter template
          </Button>
        </div>
      )}
      <MarkdownEditor sdk={sdk} isInitiallyDisabled={false} />
    </div>
  );
}

export default SJMarkdown;
