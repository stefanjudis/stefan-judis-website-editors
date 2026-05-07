import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SJMarkdown from './components/field-editors/markdown.js';
import SJRichtext from './components/field-editors/richtext.js';
import SJSingleMediaEditor from './components/field-editors/single-media-editor.js';
import LongTextConfig from './components/config/long-text-config';
import VideoPreviewConfig from './components/config/video-preview-config';
import FieldSelect from './components/config/field-select';

import { init, locations } from '@contentful/app-sdk';
import { renderMarkdownDialog } from '@contentful/field-editor-markdown';
import { SingleEntryReferenceEditor } from '@contentful/field-editor-reference';
import { Heading, Tabs, TabPanel } from '@contentful/f36-components';

const root = createRoot(document.getElementById('root'));
const queryClient = new QueryClient();

const renderApp = (element) =>
  root.render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
  );

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return renderApp(<Config sdk={sdk} />);
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    sdk.window.startAutoResizer();

    if (sdk.field.type === 'Text') {
      return renderApp(<SJMarkdown sdk={sdk} />);
    } else if (sdk.field.type === 'RichText') {
      return renderApp(<SJRichtext sdk={sdk} />);
    } else if (sdk.field.type === 'Link') {
      return renderApp(<LinkPreview sdk={sdk} />);
    }
  }

  if (sdk.location.is(locations.LOCATION_PAGE)) {
    return renderApp(<div>hello world</div>);
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    return renderApp(renderMarkdownDialog(sdk));
  }
});

class Config extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parameters: {},
      contentTypes: [],
      selectedAppFields: [],
      currentTabId: 'long',
    };
    this.app = this.props.sdk.app;
    this.app.onConfigure(() => this.onConfigure());
    this.space = this.props.sdk.space;
    this.appId = this.props.sdk.ids.app;

    this.TABS_CONFIG = [
      {
        fieldTypes: ['Text', 'RichText'],
        id: 'long',
        label: 'Enriched long text / rich text',
        Component: LongTextConfig,
      },
      {
        fieldTypes: ['Link'],
        id: 'video-preview',
        label: 'Inline video preview',
        Component: VideoPreviewConfig,
      },
    ];

    this.setParameter = this.setParameter.bind(this);
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

  setParameter(key, value) {
    const parameters = { ...this.state.parameters, [key]: value };

    this.setState({
      ...this.state,
      ...{ parameters },
    });
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
    const getFieldSelect = ({ fieldTypes }) => {
      return (
        <FieldSelect
          contentTypes={this.state.contentTypes}
          fieldTypes={fieldTypes}
          selectedAppFields={this.state.selectedAppFields}
          onFieldChange={(field, options) =>
            this.handleFieldSelectionChange(field, options)
          }
        />
      );
    };

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1em' }}>
        <Heading as="h1">Custom field editors</Heading>
        <Tabs
          currentTab={this.state.currentTabId}
          onTabChange={(id) => this.setState({ currentTabId: id })}
        >
          <Tabs.List variant="horizontal-divider">
            {this.TABS_CONFIG.map(({ id, label }) => (
              <Tabs.Tab key={id} panelId={id}>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {this.TABS_CONFIG.map(({ id, fieldTypes, Component }) => (
            <TabPanel id={id} key={id}>
              <Component
                parameters={this.state.parameters}
                setParameter={this.setParameter}
                FieldSelect={getFieldSelect({ fieldTypes })}
              />
            </TabPanel>
          ))}
        </Tabs>
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
