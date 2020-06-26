import React, { Component } from 'react';
import { render } from 'react-dom';

import LongTextEditor from './components/field-editors/enriched-long-text/index.js';
import LongTextConfig, {
  LongTextConfigParameters,
} from './components/field-editors/enriched-long-text/config.js';

import VideoPreviewEditor from './components/field-editors/video-preview/index.js';
import VideoPreviewConfig, {
  VideoPreviewConfigParameters,
} from './components/field-editors/video-preview/config.js';

import FieldSelect from './components/config/field-select';
import FieldEditorDropdown from './components/config/field-dropdown';

import { init, locations } from 'contentful-ui-extensions-sdk';
import { renderMarkdownDialog } from '@contentful/field-editor-markdown';
import {
  Card,
  Heading,
  SectionHeading,
  Subheading,
} from '@contentful/forma-36-react-components';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';

import { getFieldConntectionId } from './components/util.js';

const ROOT = document.getElementById('root');
const FIELD_EDITOR_CONFIG = {
  'enriched-long-text': {
    fieldTypes: ['Text', 'RichText'],
    label: 'Enriched long text / rich text',
    defaultParameters: LongTextConfigParameters,

    Config: LongTextConfig,
    Editor: LongTextEditor,
  },
  'video-inline-preview': {
    fieldTypes: ['Link'],
    id: 'video-inline-preview',
    label: 'Inline video preview',
    defaultParameters: VideoPreviewConfigParameters,

    Config: VideoPreviewConfig,
    Editor: VideoPreviewEditor,
  },
};

function getCustomEditorForField(sdk) {
  const connectionId = getFieldConntectionId(sdk.field, sdk.contentType);

  return sdk.parameters.installation.installedCustomEditors.find((editor) =>
    editor.connectedFields.includes(connectionId)
  );
}

function renderCustomEditor(sdk) {
  const editor = getCustomEditorForField(sdk);
  const editorConfig = FIELD_EDITOR_CONFIG[editor.configId];

  if (editorConfig.fieldTypes.includes(sdk.field.type)) {
    render(
      <editorConfig.Editor sdk={sdk} parameters={editor.parameters} />,
      ROOT
    );
  } else {
    // error handling
  }
}

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return render(<Config sdk={sdk} />, ROOT);
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    sdk.window.startAutoResizer();
    renderCustomEditor(sdk);
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    renderMarkdownDialog(sdk);
  }
});

class Config extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parameters: { installedCustomEditors: [] },
      contentTypes: [],
      activeAppFields: [],
    };
    this.app = this.props.sdk.app;
    this.app.onConfigure(() => this.onConfigure());
    this.space = this.props.sdk.space;
    this.appId = this.props.sdk.ids.app;
    this.setEditorParameter = this.setEditorParameter.bind(this);
  }

  async componentDidMount() {
    const [contentTypes, editorInterfaces, parameters] = await Promise.all([
      this.space.getContentTypes(),
      this.space.getEditorInterfaces(),
      this.app.getParameters(),
    ]);

    this.setState(
      {
        parameters: { ...this.state.parameters, ...parameters },
        contentTypes: contentTypes.items,
        activeAppFields: this.getActiveAppFields(editorInterfaces.items),
      },
      () => this.app.setReady()
    );
  }

  getActiveAppFields(editorInterfaces) {
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

  setParameter(key, value) {
    const parameters = { ...this.state.parameters, [key]: value };

    this.setState({
      parameters,
    });
  }

  setEditorParameter(editor, key, value) {
    const { installedCustomEditors } = this.state.parameters;
    let currentEditor = installedCustomEditors.find(
      (installedEditor) => installedEditor.id === editor.id
    );

    currentEditor.parameters = {
      ...currentEditor.parameters,
      ...{ [key]: value },
    };

    this.setState({
      installedCustomEditors: installedCustomEditors.map((editor) =>
        editor.id === currentEditor.id ? { ...currentEditor } : editor
      ),
    });
  }

  handleFieldSelectionChange(field, { editor, isSelected }) {
    const { activeAppFields } = this.state;
    const { installedCustomEditors } = this.state.parameters;

    if (isSelected) {
      this.setState({
        activeAppFields: [
          ...activeAppFields,
          {
            contentTypeId: field.contentType.sys.id,
            fieldId: field.id,
            widgetId: this.appId,
            widgetNamespace: 'app',
          },
        ],
      });

      this.setParameter(
        'installedCustomEditors',
        installedCustomEditors.map((cEditor) => {
          if (cEditor.id !== editor.id) {
            return cEditor;
          }

          return {
            ...cEditor,
            connectedFields: [
              ...cEditor.connectedFields,
              getFieldConntectionId(field, field.contentType),
            ],
          };
        })
      );
    } else {
      this.setState({
        activeAppFields: activeAppFields.filter(
          (selectedField) =>
            selectedField.fieldId !== field.id ||
            selectedField.contentTypeId !== field.contentType.sys.id
        ),
      });

      this.setParameter(
        'installedCustomEditors',
        installedCustomEditors.map((cEditor) => {
          if (cEditor.id !== editor.id) {
            return cEditor;
          }

          return {
            ...cEditor,
            connectedFields: cEditor.connectedFields.filter(
              (fieldId) =>
                fieldId !== getFieldConntectionId(field, field.contentType)
            ),
          };
        })
      );
    }
  }

  addCustomEditor(editorConfigId) {
    const editorConfig = FIELD_EDITOR_CONFIG[editorConfigId];

    const installedCustomEditors = [
      ...this.state.parameters.installedCustomEditors,
      {
        id: `${editorConfigId}-${
          this.state.parameters.installedCustomEditors.length + 1
        }`,
        configId: editorConfigId,
        connectedFields: [],
        parameters: { ...editorConfig.defaultParameters },
      },
    ];

    this.setParameter('installedCustomEditors', installedCustomEditors);
  }

  render() {
    const getFieldSelect = ({ editor, fieldTypes }) => {
      return (
        <>
          <SectionHeading className="h-2" element="h2">
            Define the content model fields that should use this editor
          </SectionHeading>
          {editor.id}
          <FieldSelect
            contentTypes={this.state.contentTypes}
            fieldTypes={fieldTypes}
            editor={editor}
            activeAppFields={this.state.activeAppFields}
            onFieldChange={(field, options) =>
              this.handleFieldSelectionChange(field, options)
            }
          />
        </>
      );
    };

    const { installedCustomEditors } = this.state.parameters;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1em' }}>
        <Heading element="h1">Custom field editors</Heading>

        <FieldEditorDropdown
          config={FIELD_EDITOR_CONFIG}
          onClick={(editorConfigId) => {
            this.addCustomEditor(editorConfigId);
          }}
        />

        <ul className="u-list-reset">
          {installedCustomEditors.map((editor, index) => {
            const config = FIELD_EDITOR_CONFIG[editor.configId];

            return (
              <li key={index}>
                <Card>
                  <Subheading>{config.label}</Subheading>
                  {editor.id}
                  <config.Config
                    editor={editor}
                    setEditorParameter={this.setEditorParameter}
                    FieldSelect={getFieldSelect({
                      fieldTypes: config.fieldTypes,
                      editor,
                    })}
                  />
                </Card>
              </li>
            );
          })}
        </ul>

        <pre>
          <code>{JSON.stringify(this.state, null, 2)}</code>
        </pre>
      </div>
    );
  }

  async onConfigure() {
    const EditorInterface = this.state.activeAppFields.reduce(
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
