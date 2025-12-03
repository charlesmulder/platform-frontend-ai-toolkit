# Table States

DataView tables support multiple visual states to provide clear feedback about data availability and application status. These states help users understand what's happening and guide them through different scenarios like loading, empty data, errors, or successful data display.

## Overview

Table states in DataView are controlled through two main mechanisms:

1. **Active State** - Set globally on the `<DataView>` component using the `activeState` prop (accepts any string value)
2. **State Components** - Custom components defined in `headStates` and `bodyStates` props on `<DataViewTable>`

**Note:** The `activeState` prop accepts any string value, allowing for custom state names. `DataViewState` is simply an enum providing common state constants for convenience, but you can use any string identifier for your custom states.

## Available States

### Loading State

**When to use:** During data fetching, API calls, or any asynchronous operations.

**Implementation:**
```jsx
import { DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';

const headLoading = <SkeletonTableHead columns={columns} />;
const bodyLoading = <SkeletonTableBody rowsCount={5} columnsCount={columns.length} />;

<DataView activeState={DataViewState.loading}>
  <DataViewTable
    columns={columns}
    rows={[]}
    headStates={{ loading: headLoading }}
    bodyStates={{ loading: bodyLoading }}
  />
</DataView>
```

**Key features:**
- Animated skeleton placeholders
- Configurable row and column counts
- Smooth transition to loaded content

### Empty State

**When to use:** When no data is available to display, after filtering returns no results, or for new datasets.

**Implementation:**
```jsx
import { EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions, Button } from '@patternfly/react-core';
import { Tbody, Td, Tr } from '@patternfly/react-table';
import { CubesIcon } from '@patternfly/react-icons';

const empty = (
  <Tbody>
    <Tr>
      <Td colSpan={columns.length}>
        <EmptyState headingLevel="h4" icon={CubesIcon} titleText="No data found">
          <EmptyStateBody>There are no matching data to be displayed.</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary">Add data</Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Td>
    </Tr>
  </Tbody>
);

<DataView activeState="empty">
  <DataViewTable
    columns={columns}
    rows={[]}
    bodyStates={{ empty }}
  />
</DataView>
```

**Key features:**
- Clear messaging about data absence
- Optional call-to-action buttons
- Spans full table width
- Customizable icons and content

### Error State

**When to use:** When data loading fails, API errors occur, or system issues prevent data display.

**Implementation:**
```jsx
const errorState = (
  <Tbody>
    <Tr>
      <Td colSpan={columns.length}>
        <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Unable to load data">
          <EmptyStateBody>An error occurred while loading the data. Please try again.</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={retryFunction}>Try again</Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Td>
    </Tr>
  </Tbody>
);

<DataView activeState="error">
  <DataViewTable
    columns={columns}
    rows={[]}
    bodyStates={{ error: errorState }}
  />
</DataView>
```

### Loaded State (Default)

**When to use:** When data has been successfully loaded and is ready for display.

**Implementation:**
```jsx
<DataView>
  <DataViewTable
    columns={columns}
    rows={dataRows}
  />
</DataView>
```

**Key features:**
- No special configuration needed
- Default state when `activeState` is not specified
- Displays actual data content

### Custom States

**When to use:** For application-specific scenarios not covered by common states.

**Implementation:**
```jsx
const customState = (
  <Tbody>
    <Tr>
      <Td colSpan={columns.length}>
        <EmptyState headingLevel="h4" titleText="Custom scenario">
          <EmptyStateBody>Your custom message here.</EmptyStateBody>
        </EmptyState>
      </Td>
    </Tr>
  </Tbody>
);

<DataView activeState="myCustomState">
  <DataViewTable
    columns={columns}
    rows={[]}
    bodyStates={{ myCustomState: customState }}
  />
</DataView>
```

**Key features:**
- Use any string identifier for `activeState`
- Create corresponding entries in `headStates` or `bodyStates`
- Full control over custom state appearance and behavior

## State Management Patterns

### Dynamic State Switching

```jsx
const MyTable = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [data, setData] = useState([]);

  const getActiveState = () => {
    if (isLoading) return DataViewState.loading; // or simply 'loading'
    if (hasError) return 'error';
    if (data.length === 0) return 'empty';
    return undefined; // loaded state (default)
  };

  return (
    <DataView activeState={getActiveState()}>
      <DataViewTable
        columns={columns}
        rows={data}
        headStates={{ loading: headLoading }}
        bodyStates={{
          loading: bodyLoading,
          empty: emptyState,
          error: errorState
        }}
      />
    </DataView>
  );
};
```

### Conditional State Configuration

- **`headStates`** - Configure states for table headers (typically only loading needed)
- **`bodyStates`** - Configure states for table body content (loading, empty, error, etc.)
- **`activeState`** - Controls which state is currently displayed

## Best Practices

1. **Loading States:**
   - Always provide loading feedback for asynchronous operations
   - Match skeleton structure to actual content
   - Keep loading duration reasonable (avoid flickering or perceived slowness)

2. **Empty States:**
   - Provide clear, helpful messaging
   - Include actionable next steps when appropriate
   - Use consistent iconography across your application

3. **Error States:**
   - Clearly communicate what went wrong
   - Provide retry mechanisms when possible
   - Log errors for debugging while showing user-friendly messages

4. **State Transitions:**
   - Ensure smooth transitions between states
   - Avoid jarring visual changes
   - Maintain layout consistency across states

5. **Accessibility:**
   - Use proper heading levels in state components
   - Ensure sufficient color contrast
   - Provide appropriate ARIA labels and descriptions