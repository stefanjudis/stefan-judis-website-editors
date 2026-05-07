import React from 'react';

import { ConnectedRichTextEditor } from '@contentful/field-editor-rich-text';

function SJRichtext({ sdk }) {
  return (
    <div>
      <ConnectedRichTextEditor sdk={sdk} />
    </div>
  );
}

export default SJRichtext;
