# DataView Toolbar

This example demonstrates one of the core building blocks of the DataView system in isolation. The DataViewToolbar component renders a default, opinionated toolbar that can be positioned above or below your data section to provide essential data management controls.

The DataView toolbar can contain:
- **Pagination** - Navigate through paginated data sets
- **Bulk select** - Select multiple items with convenient bulk operations
- **Filters** - Text filters, checkbox filters, and other filtering controls
- **Actions** - Primary and secondary action buttons for data operations
- **Custom content** - Any additional toolbar items using the toolbar item component

This isolated example shows how you can use the toolbar independently of other DataView components, making it useful for:
- Custom data layouts where you want DataView toolbar styling and behavior
- Building your own data presentation while leveraging the toolbar's functionality
- Testing and prototyping toolbar configurations before integrating with tables or lists
- Creating consistent toolbar experiences across different data displays

You can pass child items to the toolbar using predefined `<DataViewToolbar>` props for common use cases, or use the toolbar item component for fully custom implementations.

```jsx
/* eslint-disable no-console */
import React from 'react';
import { Pagination } from '@patternfly/react-core';
import { BulkSelect } from '@patternfly/react-component-groups';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { ResponsiveAction, ResponsiveActions } from '@patternfly/react-component-groups';
import { DataViewFilters } from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewTextFilter';

export const BasicExample: React.FunctionComponent = () => (
  <DataViewToolbar 
    clearAllFilters={() => console.log('clearAllFilters called')}
    bulkSelect={
      <BulkSelect
        selectedCount={0}
        pageCount={5}
        onSelect={() => console.log('onSelect called')}
      />  
    }
    filters={ 
      <DataViewFilters onChange={() => console.log('onSetFilters calles')} values={{}}>
        <DataViewTextFilter filterId="name" title='Name' placeholder='Filter by name' />
        <DataViewTextFilter filterId="branch" title='Branch' placeholder='Filter by branch' />
      </DataViewFilters>
    }
    actions={
      <ResponsiveActions ouiaId="example-actions">
        <ResponsiveAction>Add repository</ResponsiveAction>
        <ResponsiveAction>Delete repository</ResponsiveAction>
      </ResponsiveActions>
    }
    pagination={
      <Pagination page={1} perPage={10} isCompact />
    } 
  />
)

```
