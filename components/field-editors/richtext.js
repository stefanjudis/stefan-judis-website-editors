import React from 'react';

import { RichTextEditor } from '@contentful/field-editor-rich-text';

function SJRichtext({ sdk }) {
  return (
    <div>
      <RichTextEditor sdk={sdk} />
    </div>
  );
}

export default SJRichtext;
