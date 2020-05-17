import React, { Component, useEffect, useState } from 'react';
import { render } from 'react-dom';
import 'codemirror/lib/codemirror.css';
import debounce from 'lodash.debounce';
import showdown from 'showdown';
import alex from 'alex';
import { init, locations } from 'contentful-ui-extensions-sdk';
import { MarkdownEditor } from '@contentful/field-editor-markdown';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import {
  Button,
  Note,
  List,
  ListItem,
} from '@contentful/forma-36-react-components';

const DEFAULT_ANIMAL = 'cat';

const markdownConverter = new showdown.Converter();

init((sdk) => {
  let Component;

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    Component = Config;
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    Component = SJMarkdown;
  }

  render(<Component sdk={sdk} />, document.getElementById('root'));
  sdk.window.startAutoResizer();
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
    const {
      items: contentTypes,
    } = await this.props.sdk.space.getContentTypes();
    const contentTypeIds = contentTypes.map((ct) => ct.sys.id);

    return {
      parameters: this.state.parameters,
      targetState: {
        EditorInterface: contentTypeIds.reduce((acc, id) => {
          return { ...acc, [id]: { sidebar: { position: 0 } } };
        }, {}),
      },
    };
  }
}

function SJMarkdown({ sdk }) {
  const [wasCopied, setWasCopied] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [languageErrors, setLanguageErrors] = useState([]);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      debounce(() => {
        setLanguageErrors(alex.markdown(value).messages);
        setWasCopied(false);
      }, 1000)();
    });
  }, []);

  function copyToClipboard() {
    const previewText = markdownConverter.makeHtml(sdk.field.getValue());

    function listener(e) {
      e.clipboardData.setData('text/html', previewText);
      e.clipboardData.setData('text/plain', previewText);
      e.preventDefault();
    }

    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);
    setWasCopied(true);
  }

  return (
    <div>
      <div>
        <div style={{ position: 'relative', marginBottom: '.5em' }}>
          {!languageErrors.length ? (
            <Note noteType="positive">All good!</Note>
          ) : (
            <Note
              title={`There are ${languageErrors.length} Alex.js warnings`}
              noteType="warning"
            >
              {showErrors ? (
                <List style={{ marginTop: '1em' }}>
                  {languageErrors.map(({ message, name }) => (
                    <ListItem key={name}>{message}</ListItem>
                  ))}
                </List>
              ) : (
                ''
              )}
            </Note>
          )}
          {languageErrors.length ? (
            <Button
              size="small"
              buttonType={showErrors ? 'muted' : 'warning'}
              onClick={() => setShowErrors(!showErrors)}
              style={{
                position: 'absolute',
                top: '.675em',
                right: '.5em',
              }}
            >
              {showErrors ? 'Hide errors' : 'Show errors'}
            </Button>
          ) : (
            ''
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '0.5em',
          }}
        >
          <Button
            size="small"
            buttonType={wasCopied ? 'muted' : 'primary'}
            onClick={copyToClipboard}
            style={{
              marginLeft: 'auto',
            }}
          >
            {wasCopied ? 'Copied...' : 'Copy preview'}
          </Button>
        </div>
      </div>
      <MarkdownEditor sdk={sdk} />
    </div>
  );
}
