# Loading State

This example demonstrates how to implement loading states in DataView tables to provide visual feedback when data is being fetched or processed. Loading states improve user experience by clearly communicating that the application is working and prevent users from thinking the interface has frozen or failed.

## Implementation

Loading states in DataView are configured through two key elements:

### 1. Active State Configuration

Set the `activeState` prop on the `<DataView>` component to `DataViewState.loading` to activate the loading state globally. This tells the DataView system that the table is currently in a loading state.

### 2. Loading Components

Configure loading placeholders for both the table header and body:

- **`headStates.loading`** - Defines the loading placeholder for table headers using `SkeletonTableHead`
- **`bodyStates.loading`** - Defines the loading placeholder for table content using `SkeletonTableBody`

## Skeleton Components

The example uses PatternFly's skeleton components from `@patternfly/react-component-groups`:

- **`SkeletonTableHead`** - Creates animated skeleton placeholders for column headers
- **`SkeletonTableBody`** - Creates animated skeleton placeholders for table rows with configurable row and column counts

## Configuration Options

**SkeletonTableHead:**
- Automatically matches the structure of your columns array
- Provides realistic loading placeholders for header content

**SkeletonTableBody:**
- `rowsCount` - Number of skeleton rows to display during loading
- `columnsCount` - Number of skeleton columns (should match your actual column count)

## Best Practices

- Use loading states for any asynchronous data operations (API calls, database queries, file loading)
- Match skeleton row/column counts to your expected data structure
- Keep loading states visually consistent with your final table layout
- Consider loading state duration - too fast may cause flickering, too slow impacts perceived performance

This pattern ensures users understand that data is being loaded and provides a smooth transition when the actual content appears.

```jsx
import { FunctionComponent } from 'react';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable, DataViewTr, DataViewTh } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';

// you can also pass props to Tr by returning { row: DataViewTd[], props: TrProps } }
const rows: DataViewTr[] = [];

const columns: DataViewTh[] = [ 'Repositories', 'Branches', 'Pull requests', 'Workspaces', 'Last commit' ];

const ouiaId = 'TableExample';

const headLoading = <SkeletonTableHead columns={columns} />;
const bodyLoading = <SkeletonTableBody rowsCount={5} columnsCount={columns.length} />;

export const BasicExample: FunctionComponent = () => (
  <DataView activeState={DataViewState.loading}>
    <DataViewTable
      aria-label="Repositories table"
      ouiaId={ouiaId}
      columns={columns}
      rows={rows}
      headStates={{ loading: headLoading }}
      bodyStates={{ loading: bodyLoading }}
    />
  </DataView>
);

```