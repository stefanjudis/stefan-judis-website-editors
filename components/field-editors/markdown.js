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
  Switch,
} from '@contentful/forma-36-react-components';
import alexLogo from '../../images/alex-logo.svg';
import forbiddenWordsLogo from '../../images/forbidden-words-logo.svg';

const markdownConverter = new showdown.Converter();

function WarningsBox({ warnings, options }) {
  const { logo, noWarningsTitle, warningsTitle, renderWarning, type } = options;

  const [showWarnings, setShowWarnings] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '2em',
          padding: '.375em',
          width: 'auto',
          color: warnings.length ? 'rgb(210, 172, 121)' : 'rgb(183, 222, 208)',
          position: 'absolute',
          left: '0.5em',
          top: '0.5em',
          background: '#fff',
          border: '1px solid currentColor',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <img
          src={logo}
          alt="Alex.js logo"
          style={{
            height: 'auto',
            width: '1.5em',
          }}
        />
      </div>
      {!warnings.length ? (
        <Note noteType="positive" style={{ paddingLeft: '4em' }}>
          {noWarningsTitle}
        </Note>
      ) : (
        <Note
          title={warningsTitle}
          style={{ paddingLeft: '4em' }}
          noteType="warning"
        >
          {showWarnings ? (
            <List style={{ marginTop: '1em', paddingLeft: '0' }}>
              {warnings.map((warning, index) => (
                <ListItem key={index}>{renderWarning(warning)}</ListItem>
              ))}
            </List>
          ) : (
            ''
          )}
        </Note>
      )}
      {warnings.length ? (
        <div
          style={{
            position: 'absolute',
            top: '.75em',
            right: '.75em',
          }}
        >
          <Switch
            id={`${type}-warning-toggle`}
            // className={text('className', '')}
            isChecked={showWarnings}
            labelText="Show warnings"
            onToggle={() => setShowWarnings(!showWarnings)}
          />
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

function copyToClipboard(value) {
  const previewText = markdownConverter.makeHtml(value);

  function listener(e) {
    e.clipboardData.setData('text/html', previewText);
    e.clipboardData.setData('text/plain', previewText);
    e.preventDefault();
  }

  document.addEventListener('copy', listener);
  document.execCommand('copy');
  document.removeEventListener('copy', listener);
}

function SJMarkdown({ sdk }) {
  const [wasCopied, setWasCopied] = useState(false);
  const [alexWarnings, setAlexWarnings] = useState([]);
  const [forbiddenWordWarnings, setForbiddenWordWarnings] = useState([]);

  const forbiddenWords = sdk.parameters.installation.forbiddenWords;

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      debounce(() => {
        setAlexWarnings(alex.markdown(value).messages);
        setWasCopied(false);

        setForbiddenWordWarnings(
          forbiddenWords.reduce((acc, word) => {
            if (value.includes(word)) {
              acc.push(`${word} is included in the text`);
            }

            return acc;
          }, [])
        );
      }, 1000)();
    });
  }, []);

  return (
    <div>
      <div>
        <div
          style={{
            marginBottom: '.5em',
          }}
        >
          <WarningsBox
            warnings={alexWarnings}
            options={{
              logo: alexLogo,
              noWarningsTitle: 'There are no Alex.js warnings',
              type: 'alex-js',
              warningsTitle: 'There are Alex.js warnings',
              renderWarning: ({ line, message }) => (
                <>
                  <strong>Line: {line}</strong>: {message}
                </>
              ),
            }}
          />
        </div>
        <div
          style={{
            marginBottom: '.5em',
          }}
        >
          <WarningsBox
            warnings={forbiddenWordWarnings}
            options={{
              logo: forbiddenWordsLogo,
              type: 'forbidden-words',
              noWarningsTitle: "You're not using any forbidden words",
              warningsTitle: "You're using forbidden words",
              renderWarning: (warning) => warning,
            }}
          />
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
            onClick={() => {
              copyToClipboard(sdk.field.getValue());
              setWasCopied(true);
            }}
            style={{
              marginLeft: 'auto',
            }}
          >
            {wasCopied ? 'Copied...' : 'Copy preview'}
          </Button>
        </div>
      </div>
      <div>
        <MarkdownEditor sdk={sdk} />
      </div>
    </div>
  );
}

export default SJMarkdown;
