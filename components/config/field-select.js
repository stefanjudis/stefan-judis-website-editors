import React from 'react';
import { CheckboxField } from '@contentful/forma-36-react-components';

function getFieldsOfType(contentTypes, { fieldTypes, selectedAppFields }) {
  const isSelected = (field) =>
    selectedAppFields.some(
      (selectedField) =>
        selectedField.fieldId === field.id &&
        field.contentType.sys.id === selectedField.contentTypeId
    );

  return contentTypes.reduce((acc, contentType) => {
    return contentType.fields.reduce((acc, field) => {
      if (fieldTypes.includes(field.type)) {
        acc.push({
          contentType,
          isSelected: isSelected({ contentType, ...field }),
          ...field,
        });
      }

      return acc;
    }, acc);
  }, []);
}

function FieldSelect({
  contentTypes,
  fieldTypes,
  selectedAppFields,
  onFieldChange,
}) {
  const fields = getFieldsOfType(contentTypes, {
    fieldTypes,
    selectedAppFields,
  });
  return (
    <ul>
      {fields.map((field) => (
        <li key={`${field.id}-${field.contentType.sys.id}`}>
          <CheckboxField
            labelText={`${field.name} in ${field.contentType.name} (${field.type})`}
            name={`${field.name}-${field.contentType.sys.id}`}
            checked={field.isSelected}
            onChange={() =>
              onFieldChange(field, { isSelected: !field.isSelected })
            }
            id={`${field.name}-${field.contentType.sys.id}`}
          />
        </li>
      ))}
    </ul>
  );
}

export default FieldSelect;
