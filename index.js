import React, { Component } from 'react';
import { render } from 'react-dom';

import SJMarkdown from './components/markdown.js';
import SJSingleMediaEditor from './components/single-media-editor.js';
import { init, locations } from 'contentful-ui-extensions-sdk';
import { renderMarkdownDialog } from '@contentful/field-editor-markdown';
import { SingleEntryReferenceEditor } from '@contentful/field-editor-reference';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

const ROOT = document.getElementById('root');

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return render(<Config sdk={sdk} />, ROOT);
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    sdk.window.startAutoResizer();

    if (sdk.field.type === 'Text') {
      return render(<SJMarkdown sdk={sdk} />, ROOT);
    } else if (sdk.field.type === 'Link') {
      return render(<LinkPreview sdk={sdk} />, ROOT);
    }
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    Component = renderMarkdownDialog(sdk);
  }
});

class Config extends Component {
  constructor(props) {
    super(props);
    this.state = { parameters: {} };
    this.app = this.props.sdk.app;
    this.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount() {
    const parameters = await this.app.getParameters();
    this.setState({ parameters: parameters || {} }, () => this.app.setReady());
  }

  render() {
    return <p>nothing to do here yet. :)</p>;
  }

  async onConfigure() {
    return {
      parameters: this.state.parameters,
      targetState: {},
    };
  }
}

function LinkPreview({ sdk }) {
  const isVideo = !!sdk.field.validations.find((validation) => {
    return validation?.linkMimetypeGroup.includes('video');
  });

  if (isVideo) {
    return <SJSingleMediaEditor sdk={sdk} />;
  } else {
    return <SingleEntryReferenceEditor sdk={sdk} />;
  }
}
