import React from 'react';
import { Pill, TextField } from '@contentful/forma-36-react-components';

function LongTextConfig({ FieldSelect, editor, setEditorParameter }) {
  const handleForbiddenWordsChange = ({ target }) => {
    const forbiddenWords = target.value
      .split(',')
      .map((word) => word.trim())
      .filter((word) => !!word.length);

    setEditorParameter(editor, 'forbiddenWords', forbiddenWords);
  };

  const { parameters } = editor;

  return (
    <>
      <TextField
        className=""
        countCharacters={false}
        helpText="Define a list of comma-separated words that should not appear in your copy"
        id="emailInput"
        labelText="List of words"
        name="forbiddenWords"
        onBlur={handleForbiddenWordsChange}
        onChange={handleForbiddenWordsChange}
        required={false}
        textInputProps={{
          disabled: false,
          placeholder: 'easy, easily, just, ...',
          type: 'text',
        }}
        textarea={true}
        value={parameters.forbiddenWords.join(',')}
        validationMessage=""
        width="full"
      />
      <ul className="u-list-reset">
        {parameters.forbiddenWords.map((word, index) => (
          <li
            key={index}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
          >
            <Pill className="" label={word} />
          </li>
        ))}
      </ul>

      {FieldSelect}
    </>
  );
}

export const LongTextConfigParameters = {
  forbiddenWords: [],
};

export default LongTextConfig;
