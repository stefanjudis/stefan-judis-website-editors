import React, { Component, useEffect, useState } from 'react';
import { render } from 'react-dom';
import 'codemirror/lib/codemirror.css';
import debounce from 'lodash.debounce';
import showdown from 'showdown';
import alex from 'alex';
import { init, locations } from 'contentful-ui-extensions-sdk';
import {
  MarkdownEditor,
  renderMarkdownDialog,
} from '@contentful/field-editor-markdown';
import {
  SingleMediaEditor,
  SingleEntryReferenceEditor,
} from '@contentful/field-editor-reference';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import {
  Button,
  List,
  ListItem,
  Note,
  Pill,
  Spinner,
} from '@contentful/forma-36-react-components';

const DEFAULT_ANIMAL = 'cat';

const markdownConverter = new showdown.Converter();
const ROOT = document.getElementById('root');

init((sdk) => {
  let Component;

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
                <List style={{ marginTop: '1em', paddingLeft: '0' }}>
                  {languageErrors.map(({ line, message, name }) => (
                    <ListItem key={name}>
                      <strong>Line: {line}</strong>: {message}
                    </ListItem>
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
      <div className={showErrors ? 'show-line-numbers' : ''}>
        <MarkdownEditor sdk={sdk} />
      </div>
    </div>
  );
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

function SJSingleMediaEditor({ sdk }) {
  const [value, setValue] = useState(null);
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    console.log('mounted', sdk.field.id);
    sdk.field.onValueChanged((value) => {
      if (value) {
        setValue(value);
        sdk.space.getAsset(value.sys.id).then((asset) => {
          setAsset(asset);
        });
      } else {
        setValue(null);
      }
    });
  }, []);

  if (!value) {
    return (
      <SingleMediaEditor
        sdk={sdk}
        parameters={{
          instance: {
            canCreateEntity: true,
            canLinkEntity: true,
          },
        }}
      />
    );
  }

  if (!asset) {
    return <Spinner />;
  }

  const file = asset.fields.file[sdk.field.locale];
  const { contentType } = file;
  const isVideo = contentType === 'video/mp4' || contentType === 'video/webm';

  return isVideo ? (
    <div>
      <div style={{ display: 'flex', marginBottom: '0.5em' }}>
        <Pill label={contentType} />
        <Button
          size="small"
          buttonType="primary"
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
          buttonType="warning"
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
  ) : (
    <SingleMediaEditor
      sdk={sdk}
      parameters={{
        instance: {
          canCreateEntity: true,
          canLinkEntity: true,
        },
      }}
    />
  );
}
