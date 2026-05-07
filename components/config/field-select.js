import React from 'react';
import { Checkbox } from '@contentful/f36-components';

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
          <Checkbox
            id={`${field.name}-${field.contentType.sys.id}`}
            name={`${field.name}-${field.contentType.sys.id}`}
            isChecked={field.isSelected}
            onChange={() =>
              onFieldChange(field, { isSelected: !field.isSelected })
            }
          >
            {`${field.name} in ${field.contentType.name} (${field.type})`}
          </Checkbox>
        </li>
      ))}
    </ul>
  );
}

export default FieldSelect;
