import React, { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import 'codemirror/lib/codemirror.css';
import showdown from 'showdown';
import alex from 'alex';
import { MarkdownEditor } from '@contentful/field-editor-markdown';
import {
  Button,
  Note,
  List,
  ListItem,
} from '@contentful/forma-36-react-components';

const markdownConverter = new showdown.Converter();

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

export default SJMarkdown;
