import React from 'react';
import { CheckboxField } from '@contentful/forma-36-react-components';

function getFieldsOfType(contentTypes, { fieldTypes, activeAppFields }) {
  return contentTypes.reduce((acc, contentType) => {
    return contentType.fields.reduce((acc, field) => {
      if (fieldTypes.includes(field.type)) {
        acc.push({
          contentType,
          ...field,
        });
      }

      return acc;
    }, acc);
  }, []);
}

function FieldSelect({
  contentTypes,
  editor,
  fieldTypes,
  activeAppFields,
  onFieldChange,
}) {
  const fields = getFieldsOfType(contentTypes, {
    fieldTypes,
    activeAppFields,
  });

  return (
    <ul className="u-list-reset">
      {fields.map((field) => {
        const checked = editor.connectedFields.some(
          (cField) => cField === `${field.id}_⭐_${field.contentType.sys.id}`
        );

        return (
          <li key={`${editor.id}-${field.id}-${field.contentType.sys.id}`}>
            <CheckboxField
              labelText={`${field.name} in ${field.contentType.name} (${field.type})`}
              name={`${field.name}-${field.contentType.sys.id}`}
              checked={checked}
              onChange={() =>
                onFieldChange(field, {
                  editor,
                  isSelected: !checked,
                })
              }
              id={`${editor.id}-${field.id}-${field.contentType.sys.id}`}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default FieldSelect;
