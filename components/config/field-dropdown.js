import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';

function FieldEditorDropdown({ config, onClick }) {
  const [isOpen, setIsOpen] = useState(false);

  console.log(config);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      key={Date.now()} // Force Reinit
      toggleElement={
        <Button
          size="small"
          buttonType="muted"
          indicateDropdown
          onClick={() => setIsOpen(!isOpen)}
        >
          Add custom editor
        </Button>
      }
    >
      <DropdownList>
        {Object.entries(config).map(([id, config]) => (
          <DropdownListItem
            key={id}
            onClick={() => {
              setIsOpen(false);
              onClick(id);
            }}
          >
            {config.label}
          </DropdownListItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

export default FieldEditorDropdown;
