# Tree Table

A tree table provides a hierarchical data representation with expandable rows and custom icons for different node types. This component is ideal for displaying nested data structures such as file systems, organizational hierarchies, category trees, or any data with parent-child relationships. Users can expand and collapse parent nodes to explore the hierarchy at their own pace.

## Key Features

- **Hierarchical Display** - Show nested data with clear parent-child relationships
- **Expandable Rows** - Interactive expand/collapse functionality for parent nodes
- **Custom Icons** - Visual indicators for different node states (collapsed, expanded, leaf)
- **Selection Support** - Row selection works across all hierarchy levels
- **Recursive Structure** - Support for unlimited nesting depth

## Implementation

### Enable Tree Table Mode

To enable tree table functionality, add the `isTreeTable` flag to the `<DataViewTable>` component. This activates the hierarchical rendering and expansion controls.

### Row Structure Requirements

Tree table rows must be defined with the following structure:

- **`row`** *(required)* - Array defining the content for each cell in the row
- **`id`** *(required)* - Unique identifier used for matching selected items and managing state
- **`children`** *(optional)* - Array of child rows following the same structure for nested levels

### Custom Icons Configuration

Customize the visual indicators for different node types:

- **`collapsedIcon`** - Icon displayed for parent nodes that are collapsed (can be expanded)
- **`expandedIcon`** - Icon displayed for parent nodes that are expanded (can be collapsed)
- **`leafIcon`** - Icon displayed for leaf nodes (no children, cannot be expanded)

### Selection Control

Row selection works seamlessly with tree tables. To disable selection for specific rows, pass the `isSelectDisabled` function to the `selection` prop of the wrapping `<DataView>` component.

## Use Cases

**File/Folder Systems** - Display directories and files with appropriate icons
**Organizational Charts** - Show company hierarchies with departments and employees
**Menu Structures** - Represent nested navigation menus with categories and items
**Category Trees** - Display product categories with subcategories
**Data Taxonomies** - Show classification systems with multiple levels

This example demonstrates a repository structure with nested child repositories, custom folder/leaf icons, and selection capabilities across all hierarchy levels.

```jsx
import { FunctionComponent } from 'react';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable, DataViewTh, DataViewTrTree } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { FolderIcon, FolderOpenIcon, LeafIcon } from '@patternfly/react-icons';


interface Repository {
  name: string;
  branches: string | null;
  prs: string | null;
  workspaces: string;
  lastCommit: string;
  children?: Repository[];
}

const repositories: Repository[] = [
  { 
    name: 'Repository one',
    branches: 'Branch one',
    prs: 'Pull request one',
    workspaces: 'Workspace one',
    lastCommit: 'Timestamp one',
    children: [
      { name: 'Repository two', branches: 'Branch two', prs: 'Pull request two', workspaces: 'Workspace two', lastCommit: 'Timestamp two' },
      { name: 'Repository three', branches: 'Branch three', prs: 'Pull request three', workspaces: 'Workspace three', lastCommit: 'Timestamp three' },
    ]
  },
  { 
    name: 'Repository four',
    branches: 'Branch four',
    prs: 'Pull request four',
    workspaces: 'Workspace four',
    lastCommit: 'Timestamp four',
    children: [ { name: 'Repository five', branches: 'Branch five', prs: 'Pull request five', workspaces: 'Workspace five', lastCommit: 'Timestamp five' } ]
  },
  { name: 'Repository six', branches: 'Branch six', prs: 'Pull request six', workspaces: 'Workspace six', lastCommit: 'Timestamp six' }
];

const buildRows = (repositories: Repository[]): DataViewTrTree[] => repositories.map((repo) => ({
  row: [ repo.name, repo.branches, repo.prs, repo.workspaces, repo.lastCommit ],
  id: repo.name, // unique ID for each row
  ...(repo.children
    ? { 
      children: buildRows(repo.children) // build rows for children
    } 
    : {})
}));

const rows: DataViewTrTree[] = buildRows(repositories);

const columns: DataViewTh[] = [ 'Repositories', 'Branches', 'Pull requests', 'Workspaces', 'Last commit' ];

const ouiaId = 'TreeTableExample';

export const BasicExample: FunctionComponent = () => {
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  return (
    <DataView selection={selection}>
      <DataViewTable 
        isTreeTable 
        ouiaId={ouiaId}
        columns={columns} 
        rows={rows}
        leafIcon={<LeafIcon/>}
        expandedIcon={<FolderOpenIcon aria-hidden />}
        collapsedIcon={<FolderIcon aria-hidden />} 
      />
    </DataView>
  );
}

```