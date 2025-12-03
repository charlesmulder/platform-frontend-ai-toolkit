# DataView Table

The DataView table component renders your data into columns and rows within a PatternFly table component. This is the core presentation layer that transforms your structured data into a fully-featured, accessible, and interactive table interface. You can easily customize and configure the table with additional DataView components and props to create rich data experiences.

## Configuring Rows and Columns

The table is configured through two main props that define the structure and content:

### Columns Configuration

The `columns` prop defines the column heads of the table. Each item in the array can be:

- **Simple ReactNode** - For basic column headers (strings, JSX elements)
- **Column Object** - For advanced configuration with these properties:
  - `cell` - Content to display in the column head
  - `props` (optional) - `ThProps` passed to the `<Th>` component (width, sort, info tooltips, etc.)

### Rows Configuration

The `rows` prop defines the rows to be displayed in the table. Each item can be:

- **Array of DataViewTd** - For simple row data
- **Row Object** - For advanced configuration with these properties:
  - `row` - Content to display in each cell in the row
  - `id` (optional) - Unique identifier for row matching in selection
  - `props` (optional) - `TrProps` passed to the `<Tr>` component (isHoverable, isRowSelected, etc.)

## Advanced Features

**Selection Control:**
Disable row selection using the `isSelectDisabled` function passed to the wrapping DataView component through the `selection` prop.

**Expandable Rows:**
Set `expandAll` prop on DataViewTable to have all expandable nodes open on initial load.

**Cell Customization:**
Each cell can contain simple data or complex ReactNodes including buttons, icons, actions, and custom components.

**Row Actions:**
Integrate `ActionsColumn` from PatternFly React Table for dropdown action menus on each row.

This example demonstrates a comprehensive table setup with mixed column types, row actions, custom cell content, and various table features.

```jsx
import { FunctionComponent } from 'react';
import { DataViewTable, DataViewTr, DataViewTh } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';

interface Repository {
  id: number;
  name: string;
  branches: string | null;
  prs: string | null;
  workspaces: string;
  lastCommit: string;
}

const repositories: Repository[] = [
  { id: 1, name: 'Repository one', branches: 'Branch one', prs: 'Pull request one', workspaces: 'Workspace one', lastCommit: 'Timestamp one' },
  { id: 2, name: 'Repository two', branches: 'Branch two', prs: 'Pull request two', workspaces: 'Workspace two', lastCommit: 'Timestamp two' },
  { id: 3, name: 'Repository three', branches: 'Branch three', prs: 'Pull request three', workspaces: 'Workspace three', lastCommit: 'Timestamp three' },
  { id: 4, name: 'Repository four', branches: 'Branch four', prs: 'Pull request four', workspaces: 'Workspace four', lastCommit: 'Timestamp four' },
  { id: 5, name: 'Repository five', branches: 'Branch five', prs: 'Pull request five', workspaces: 'Workspace five', lastCommit: 'Timestamp five' },
  { id: 6, name: 'Repository six', branches: 'Branch six', prs: 'Pull request six', workspaces: 'Workspace six', lastCommit: 'Timestamp six' }
];

const rowActions = [
  {
    title: 'Some action',
    onClick: () => console.log('clicked on Some action')  // eslint-disable-line no-console
  },
  {
    title: <div>Another action</div>,
    onClick: () => console.log('clicked on Another action')  // eslint-disable-line no-console
  },
  {
    isSeparator: true
  },
  {
    title: 'Third action',
    onClick: () => console.log('clicked on Third action')  // eslint-disable-line no-console
  }
];

// you can also pass props to Tr by returning { row: DataViewTd[], props: TrProps } }
const rows: DataViewTr[] = repositories.map(({ id, name, branches, prs, workspaces, lastCommit }) => [
  { id, cell: workspaces, props: { favorites: { isFavorited: true } } },
  { cell: <Button href='#' variant='link' isInline>{name}</Button> },
  branches,
  prs,
  workspaces,
  lastCommit,
  { cell: <ActionsColumn items={rowActions}/>, props: { isActionCell: true } },
]);

const columns: DataViewTh[] = [
  null,
  'Repositories', 
  { cell: <>Branches<ExclamationCircleIcon className='pf-v6-u-ml-sm' color="var(--pf-t--global--color--status--danger--default)"/></> }, 
  'Pull requests', 
  { cell: 'Workspaces', props: { info: { tooltip: 'More information' } } }, 
  { cell: 'Last commit', props: { sort: { sortBy: {}, columnIndex: 4 } } },
];

const ouiaId = 'TableExample';

export const BasicExample: FunctionComponent = () => (
  <DataViewTable aria-label='Repositories table' ouiaId={ouiaId} columns={columns} rows={rows} />
);

```