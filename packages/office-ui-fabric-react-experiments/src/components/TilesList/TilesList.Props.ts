
import * as React from 'react';
import { IBaseProps } from 'office-ui-fabric-react/lib/Utilities';
import { TilesList } from './TilesList';
import { Selection } from 'office-ui-fabric-react/lib/utilities/selection/Selection';

export interface ITilesHeaderItem<TItem> {
  /**
   * A unique key to assign to the header item.
   * Used only for reconciliation.
   */
  key: string;
  /**
   * The content item to render in the header.
   */
  content: TItem;
  /**
   * Invoked to render the virtual DOM for the item.
   * This content will be rendered inside the cell allocated for the item.
   */
  onRender: (content: TItem) => (React.ReactNode | React.ReactNode[]);
}

export interface ITilesGridItem<TItem> {
  /**
   * A unique key to assign to the item within the grid.
   * This is only used for reconciliation, not selection behavior.
   */
  key: string;
  /**
   * The content item to be rendered. This will be passed back to `onRender`.
   */
  content: TItem;
  /**
   * The desired dimensions of the item, used to compute aspect ratio.
   * If not provided, this is assumed to be a square equivalent to the current row height.
   */
  desiredSize?: { width: number; height: number; };
  /**
   * Invoked to render the virtual DOM for the item.
   * This content will be rendered inside the cell allocated for the item.
   */
  onRender: (content: TItem, finalSize?: ITileSize) => (React.ReactNode | React.ReactNode[]);
}

export const enum TilesGridMode {
  /**
   * Every item in the grid gets its own row.
   */
  none,
  /**
   * Items in the row are stacked without resizing until they overflow.
   */
  stack,
  /**
   * Items in the row are stretched if necessary to fill the row.
   */
  fill
}

export interface ITilesGridSegment<TItem> {
  /**
   * A unique key to assign to the grid segment.
   * This will only be used for reconciliation.
   */
  key: string;
  /**
   * The items to render as part of a contiguous, flowing grid.
   * All items will be rendered with the same base row height and margin.
   */
  items: ITilesGridItem<TItem>[];
  /**
   * The spacing to allocate between items.
   */
  spacing?: number;
  /**
   * The base height for each row.
   */
  minRowHeight: number;
  /**
   * The maximum scale factor to use when stretching items to fill a row.
   */
  maxScaleFactor?: number;
  /**
   * The mode for the grid.
   */
  mode: TilesGridMode;
  /**
   * The top margin for the grid.
   */
  marginTop?: number;
  /**
   * The bottom margin for the grid.
   */
  marginBottom?: number;
}

export interface ITileSize {
  width: number;
  height: number;
}

export interface ITilesListProps<TItem> extends IBaseProps, React.HTMLAttributes<TilesList<TItem>> {
  items: (ITilesHeaderItem<TItem> | ITilesGridSegment<TItem>)[];
  selection?: Selection;
}
