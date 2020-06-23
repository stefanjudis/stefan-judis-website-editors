import React from 'react';
import {
  Pill,
  SectionHeading,
  TextField,
} from '@contentful/forma-36-react-components';

function LongTextConfig({ FieldSelect, parameters, setParameter }) {
  const handleForbiddenWordsChange = ({ target }) => {
    const forbiddenWords = target.value
      .split(',')
      .map((word) => word.trim())
      .filter((word) => !!word.length);

    setParameter('forbiddenWords', forbiddenWords);
  };

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
      <SectionHeading className="h-2" element="h2">
        Define the fields for this experience
      </SectionHeading>
      {FieldSelect}
    </>
  );
}

export default LongTextConfig;
