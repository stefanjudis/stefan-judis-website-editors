import React, { Component } from 'react';
import { render } from 'react-dom';

import SJMarkdown from './components/markdown.js';
import SJRichtext from './components/richtext.js';
import SJSingleMediaEditor from './components/single-media-editor.js';
import { init, locations } from 'contentful-ui-extensions-sdk';
import { renderMarkdownDialog } from '@contentful/field-editor-markdown';
import { SingleEntryReferenceEditor } from '@contentful/field-editor-reference';
import {
  CheckboxField,
  Heading,
  Pill,
  SectionHeading,
  TextField,
} from '@contentful/forma-36-react-components';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

const ROOT = document.getElementById('root');

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return render(<Config sdk={sdk} />, ROOT);
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    sdk.window.startAutoResizer();

    if (sdk.field.type === 'Text') {
      return render(<SJMarkdown sdk={sdk} />, ROOT);
    } else if (sdk.field.type === 'RichText') {
      return render(<SJRichtext sdk={sdk} />, ROOT);
    } else if (sdk.field.type === 'Link') {
      return render(<LinkPreview sdk={sdk} />, ROOT);
    }
  }

  if (sdk.location.is(locations.LOCATION_PAGE)) {
    return render(<div>hello world</div>, ROOT);
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    Component = renderMarkdownDialog(sdk);
  }
});

class Config extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parameters: { forbiddenWords: [] },
      contentTypes: [],
      selectedAppFields: [],
      validFieldsForMarkdownValidation: [],
    };
    this.app = this.props.sdk.app;
    this.app.onConfigure(() => this.onConfigure());
    this.space = this.props.sdk.space;
    this.appId = this.props.sdk.ids.app;

    this.handleForbiddenWordsChange = this.handleForbiddenWordsChange.bind(
      this
    );
  }

  async componentDidMount() {
    const [contentTypes, editorInterfaces, parameters] = await Promise.all([
      this.space.getContentTypes(),
      this.space.getEditorInterfaces(),
      this.app.getParameters(),
    ]);

    this.setState(
      {
        ...this.state,
        ...{
          parameters: { ...this.state.parameters, ...parameters },
          contentTypes: contentTypes.items,
          validFieldsForMarkdownValidation: this.getAllFieldsOfType(
            contentTypes.items,
            { fieldTypes: ['Text', 'RichText'] }
          ),
          selectedAppFields: this.getSelectedAppFields(editorInterfaces.items),
        },
      },
      () => this.app.setReady()
    );
  }

  getSelectedAppFields(editorInterfaces) {
    return editorInterfaces.reduce((acc, editorInterface) => {
      return [
        ...acc,
        ...editorInterface.controls
          .filter(
            ({ widgetNamespace, widgetId }) =>
              widgetNamespace === 'app' && widgetId === this.appId
          )
          .map((control) => ({
            contentTypeId: editorInterface.sys.contentType.sys.id,
            ...control,
          })),
      ];
    }, []);
  }

  getAllFieldsOfType(contentTypes, { fieldTypes }) {
    return contentTypes.reduce((acc, contentType) => {
      return contentType.fields.reduce((acc, field) => {
        if (fieldTypes.includes(field.type)) {
          acc.push({ contentType, ...field });
        }

        return acc;
      }, acc);
    }, []);
  }

  handleForbiddenWordsChange({ target }) {
    this.setState({
      ...this.state,
      ...{
        parameters: {
          forbiddenWords: target.value
            .split(',')
            .map((word) => word.trim())
            .filter((word) => !!word.length),
        },
      },
    });
  }

  isSelectedAppField(field) {
    // console.log(field);
    return this.state.selectedAppFields.some(
      (selectedField) =>
        selectedField.fieldId === field.id &&
        field.contentType.sys.id === selectedField.contentTypeId
    );
  }

  handleFieldSelectionChange(field, { isSelected }) {
    const selectedAppFields = isSelected
      ? [
          ...this.state.selectedAppFields,
          {
            contentTypeId: field.contentType.sys.id,
            fieldId: field.id,
            widgetId: this.appId,
            widgetNamespace: 'app',
          },
        ]
      : this.state.selectedAppFields.filter(
          (selectedField) =>
            selectedField.fieldId !== field.id ||
            selectedField.contentTypeId !== field.contentType.sys.id
        );

    this.setState({
      ...this.state,
      selectedAppFields,
    });
  }

  render() {
    const { parameters, validFieldsForMarkdownValidation } = this.state;

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1em' }}>
        <Heading className="h-1" element="h1">
          Forbidden words
        </Heading>
        <TextField
          className=""
          countCharacters={false}
          helpText="Define a list of comma-separated words that should not appear in your copy"
          id="emailInput"
          labelText="List of words"
          name="forbiddenWords"
          onBlur={this.handleForbiddenWordsChange}
          onChange={this.handleForbiddenWordsChange}
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
          Can be applied to the following content type fields
        </SectionHeading>
        <ul className="u-list-reset">
          {validFieldsForMarkdownValidation.map((field) => (
            <li key={`${field.id}-${field.contentType.sys.id}`}>
              <CheckboxField
                labelText={`${field.name} in ${field.contentType.name} (${field.type})`}
                name={`${field.name}-${field.contentType.sys.id}`}
                checked={this.isSelectedAppField(field)}
                disabled={field.type !== 'Text' && field.type !== 'RichText'}
                onChange={(e) =>
                  this.handleFieldSelectionChange(field, {
                    isSelected: !this.isSelectedAppField(field),
                  })
                }
                id={`${field.name}-${field.contentType.sys.id}`}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  async onConfigure() {
    const EditorInterface = this.state.selectedAppFields.reduce(
      (acc, { contentTypeId, fieldId }) => {
        if (!acc[contentTypeId]) {
          acc[contentTypeId] = { controls: [] };
        }

        acc[contentTypeId].controls.push({ fieldId });

        return acc;
      },
      {}
    );

    return {
      parameters: this.state.parameters,
      targetState: {
        EditorInterface,
      },
    };
  }
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
