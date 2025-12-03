# Basic Data view layout setup

This demonstrates the most basic DataView setup that does not implement any data management functionality except for establishing the DataView context. Use this approach only when you need complete control over a fully customizable layout and want to build all data handling logic yourself. In most cases, you should use one of the higher-level abstractions provided by the data view package, such as DataViewTable or DataViewList, which include built-in features for sorting, filtering, pagination, and selection.


```jsx
import { FunctionComponent } from 'react';
import DataView from '@patternfly/react-data-view/dist/dynamic/DataView';

const layoutItemStyling = {
  width: '100%',
  height: '5rem',
  padding: 'var(--pf-t--global--spacer--md)',
  border: 'var(--pf-t--global--border--width--box--default) dashed var(--pf-t--global--border--color--default)'
};

export const BasicExample: FunctionComponent = () => (
  <DataView>
    <div style={layoutItemStyling}>Header</div>
    <div style={layoutItemStyling}>Data representation</div>
    <div style={layoutItemStyling}>Footer</div>
  </DataView>
);

```