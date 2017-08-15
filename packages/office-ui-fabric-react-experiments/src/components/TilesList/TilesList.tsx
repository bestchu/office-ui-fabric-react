
import * as React from 'react';
import { ITilesListProps, ITilesHeaderItem, ITilesGridSegment, TilesGridMode, ITileSize } from './TilesList.Props';
import { List, IPageProps } from 'office-ui-fabric-react/lib/List';
import { FocusZone, FocusZoneDirection } from 'office-ui-fabric-react/lib/FocusZone';
import { SelectionZone, SelectionMode } from 'office-ui-fabric-react/lib/utilities/selection/index';
import { autobind, css, IRenderFunction, IRectangle } from 'office-ui-fabric-react/lib/Utilities';
import * as TilesListStylesModule from './TilesList.scss';

const TilesListStyles: any = TilesListStylesModule;

const MAX_TILE_STRETCH = 1.5;

export interface ITilesListState<TItem> {
  cells: ITileCell<TItem>[];
}

export interface ITileGrid {
  minRowHeight: number;
  mode: TilesGridMode;
  spacing: number;
  maxScaleFactor: number;
  marginTop: number;
  marginBottom: number;
  key: string;
}

export interface ITileCell<TItem> {
  key: string;
  content: TItem;
  aspectRatio: number;
  grid: ITileGrid;
  onRender(content: TItem, finalSize: { width: number; height: number; }): React.ReactNode | React.ReactNode[];
}

interface IPageData<TItem> {
  widths: {
    [index: number]: number;
  };
  startCells: {
    [index: number]: {
      scaleFactor: number;
    }
  };
  cellSizes: {
    [index: number]: ITileSize;
  };
  extraCells: ITileCell<TItem>[] | undefined;
}

interface IPageSpecification<TItem> {
  itemCount: number;
  data: IPageData<TItem>;
}

interface IPageSpecificationCache<TItem> {
  byIndex: {
    [index: number]: IPageSpecification<TItem>;
  };
  width: number;
}

export class TilesList<TItem> extends React.Component<ITilesListProps<TItem>, ITilesListState<TItem>> {
  private _pageSpecificationCache: IPageSpecificationCache<TItem> | undefined;

  constructor(props: ITilesListProps<TItem>, context: any) {
    super(props, context);

    this.state = {
      cells: this._getCells(props.items)
    };
  }

  public componentWillReceiveProps(nextProps: ITilesListProps<TItem>) {
    if (nextProps.items !== this.props.items) {
      this.setState({
        cells: this._getCells(nextProps.items)
      });
    }
  }

  public componentWillUpdate(nextProps: ITilesListProps<TItem>, nextState: ITilesListState<TItem>) {
    if (nextState.cells !== this.state.cells) {
      this._pageSpecificationCache = undefined;
    }
  }

  public render() {
    const {
      selection
    } = this.props;

    const {
      cells
    } = this.state;

    const list = (
      <List
        items={ cells }
        getPageSpecification={ this._getPageSpecification }
        onRenderPage={ this._onRenderPage }
      />
    );

    return (
      <FocusZone
        direction={ FocusZoneDirection.bidirectional }
      >
        {
          selection ?
            <SelectionZone
              selection={ selection }
              selectionMode={ SelectionMode.multiple }>
              { list }
            </SelectionZone> :
            list
        }
      </FocusZone>
    );
  }

  private _onRenderCell(item: ITileCell<TItem>, finalSize: ITileSize) {
    if (item.grid.mode === TilesGridMode.none) {
      return (
        <div className={ css(TilesListStyles.header) }
        >
          { item.onRender(item.content, { width: 0, height: 0 }) }
        </div>
      );
    }

    const itemWidthOverHeight = item.aspectRatio;
    const itemHeightOverWidth = 1 / itemWidthOverHeight;

    return (
      <div
        role='presentation'
        className={ css(TilesListStyles.cell) }
        style={
          {
            paddingTop: `${(100 * itemHeightOverWidth).toFixed(2)}%`
          }
        }
      >
        <div
          role='presentation'
          className={ css(TilesListStyles.cellContent) }
        >
          { item.onRender(item.content, finalSize) }
        </div>
      </div>
    );
  }

  @autobind
  private _onRenderPage(pageProps: IPageProps, defaultRender?: IRenderFunction<IPageProps>) {
    const {
      page,
      className: pageClassName,
      ...divProps
    } = pageProps;

    const {
      items
    } = page;

    const data: IPageData<TItem> = page.data;

    const cells: ITileCell<TItem>[] = items || [];

    let grids: React.ReactNode[] = [];

    const previousCell = this.state.cells[page.startIndex - 1];
    const nextCell = this.state.cells[page.startIndex + page.itemCount];

    const endIndex = cells.length;

    let currentRow: IPageData<TItem>['startCells'][0] | undefined;

    for (let i = 0; i < endIndex;) {
      const grid = cells[i].grid;

      const renderedCells: React.ReactNode[] = [];

      const width = data.widths[i];

      for (; i < endIndex && cells[i].grid === grid; i++) {
        const cell = cells[i];

        const index = page.startIndex + i;
        const cellAsFirstRow = data.startCells[index];

        if (cellAsFirstRow) {
          currentRow = cellAsFirstRow;
        }

        let finalSize = data.cellSizes[index];

        if (currentRow) {
          const {
            scaleFactor
          } = currentRow;

          finalSize = {
            width: finalSize.width * currentRow.scaleFactor,
            height: finalSize.height * currentRow.scaleFactor
          };
        }

        renderedCells.push(
          <div
            key={ `${grid.key}-item-${cell.key}` }
            data-item-index={ index }
            className={ css('ms-List-cell', this._onGetCellClassName(), {
              [`ms-TilesList-cell--firstInRow ${TilesListStyles.cellFirstInRow}`]: !!cellAsFirstRow
            }) }
            style={
              {
                ...this._onGetCellStyle(cell)
              }
            }
          >
            { this._onRenderCell(cell, finalSize) }
          </div>
        );
      }

      const isOpenStart = previousCell && previousCell.grid === grid;
      const isOpenEnd = nextCell && nextCell.grid === grid;

      const margin = grid.spacing / 2;

      grids.push(
        <div
          key={ grid.key }
          className={ css('ms-TilesList-grid', {
            [`${TilesListStyles.grid}`]: grid.mode !== TilesGridMode.none
          }) }
          style={
            {
              width: `${width}px`,
              margin: `${-margin}px`,
              marginTop: isOpenStart ? '0' : `${grid.marginTop - margin}px`,
              marginBottom: isOpenEnd ? '0' : `${grid.marginBottom - margin}px`
            }
          }>
          { ...renderedCells }
        </div>
      );
    }

    return (
      <div
        { ...divProps }
        className={ css(pageClassName, this._onGetPageClassName()) }
      >
        { ...grids }
      </div>
    );
  }

  @autobind
  private _getPageSpecification(startIndex: number, bounds: IRectangle): {
    itemCount: number;
    data: IPageData<TItem>;
  } {
    if (this._pageSpecificationCache) {
      if (this._pageSpecificationCache.width !== bounds.width) {
        this._pageSpecificationCache = undefined;
      }
    }

    if (!this._pageSpecificationCache) {
      this._pageSpecificationCache = {
        width: bounds.width,
        byIndex: {}
      };
    }

    const pageSpecificationCache = this._pageSpecificationCache;

    if (pageSpecificationCache.byIndex[startIndex]) {
      return pageSpecificationCache.byIndex[startIndex];
    }

    const {
      cells
    } = this.state;

    const endIndex = Math.min(cells.length, startIndex + 100);

    let rowWidth = 0;
    let rowStart = 0;
    let fillPercent = 0;
    let i = startIndex;

    let isAtGridEnd = true;

    const startCells: IPageData<TItem>['startCells'] = {};
    let extraCells: IPageData<TItem>['extraCells'] | undefined;
    const cellSizes: IPageData<TItem>['cellSizes'] = {};
    const widths: IPageData<TItem>['widths'] = {};

    for (; i < endIndex;) {
      const grid = cells[i].grid;

      rowWidth = 0;
      rowStart = i;

      const boundsWidth = bounds.width + grid.spacing;

      widths[i] = boundsWidth;

      let currentRow = startCells[i] = {
        scaleFactor: 1
      };

      if (grid.mode === TilesGridMode.none) {
        isAtGridEnd = true;
        fillPercent = 1;
        cellSizes[i] = {
          width: bounds.width,
          height: 0
        };
        i++;
        continue;
      }

      for (; i < endIndex && cells[i].grid === grid; i++) {
        const cell = cells[i];

        const width = cell.aspectRatio * grid.minRowHeight + grid.spacing;

        if (rowWidth + width > boundsWidth) {
          const totalMargin = grid.spacing * (i - rowStart);

          if (grid.mode === TilesGridMode.fill) {
            currentRow.scaleFactor = Math.min(grid.maxScaleFactor, (boundsWidth - totalMargin) / (rowWidth - totalMargin));
          }
        }

        rowWidth += width;
        fillPercent = rowWidth / boundsWidth;

        cellSizes[i] = {
          width: cell.aspectRatio * grid.minRowHeight,
          height: grid.minRowHeight
        };

        if (rowWidth > boundsWidth) {
          rowWidth = width;
          fillPercent = rowWidth / boundsWidth;
          rowStart = i;
          currentRow = startCells[i] = {
            scaleFactor: 1
          };
        }
      }

      if (rowWidth < boundsWidth && grid.mode === TilesGridMode.fill) {
        const totalMargin = grid.spacing * (i - rowStart);
        currentRow.scaleFactor = Math.min(grid.maxScaleFactor, (boundsWidth - totalMargin) / (rowWidth - totalMargin));
      }

      if (cells[i] && cells[i].grid === grid) {
        isAtGridEnd = false;
      }

      if (fillPercent > 0 && fillPercent < 0.9 && !isAtGridEnd) {
        extraCells = cells.slice(rowStart, i);
      }
    }

    const itemCount = fillPercent > 0 && fillPercent < 0.9 && !isAtGridEnd ?
      rowStart - startIndex :
      i - startIndex;

    const pageSpecification: IPageSpecification<TItem> = {
      itemCount: itemCount,
      data: {
        widths: widths,
        startCells: startCells,
        extraCells: extraCells,
        cellSizes: cellSizes
      }
    };

    pageSpecificationCache.byIndex[startIndex] = pageSpecification;

    return pageSpecification;
  }

  @autobind
  private _onGetCellClassName(): string {
    return TilesListStyles.listCell;
  }

  @autobind
  private _onGetPageClassName(): string {
    return TilesListStyles.listPage;
  }

  @autobind
  private _onGetCellStyle(item: ITileCell<TItem>): any {
    if (item.grid.mode === TilesGridMode.none) {
      return {};
    }

    const itemWidthOverHeight = item.aspectRatio || 1;
    const itemHeightOverWidth = 1 / itemWidthOverHeight;
    const margin = item.grid.spacing / 2;

    const isFill = item.grid.mode === TilesGridMode.fill;

    const height = item.grid.minRowHeight;
    const width = itemWidthOverHeight * height;

    return {
      flex: isFill ? `${itemWidthOverHeight} ${itemWidthOverHeight} ${width}px` : `0 0 ${width}px`,
      maxWidth: isFill ? `${width * item.grid.maxScaleFactor}px` : `${width}px`,
      margin: `${margin}px`
    };
  }

  private _getCells(items: (ITilesGridSegment<TItem> | ITilesHeaderItem<TItem>)[]): ITileCell<TItem>[] {
    const cells: ITileCell<TItem>[] = [];

    for (const item of items) {
      if (isGridSegment(item)) {
        const {
          spacing = 0,
          maxScaleFactor = MAX_TILE_STRETCH,
          marginBottom = 0,
          marginTop = 0
        } = item;

        const grid: ITileGrid = {
          minRowHeight: item.minRowHeight,
          spacing: spacing,
          mode: item.mode,
          key: `grid-${item.key}`,
          maxScaleFactor: maxScaleFactor,
          marginTop: marginTop,
          marginBottom: marginBottom
        };

        for (const gridItem of item.items) {
          const {
            desiredSize
          } = gridItem;

          cells.push({
            aspectRatio: desiredSize && (desiredSize.width / desiredSize.height) || 1,
            content: gridItem.content,
            onRender: gridItem.onRender,
            grid: grid,
            key: gridItem.key
          });
        }
      } else {
        cells.push({
          aspectRatio: 1,
          content: item.content,
          onRender: item.onRender,
          grid: {
            minRowHeight: 0,
            spacing: 0,
            mode: TilesGridMode.none,
            key: `header-${item.key}`,
            maxScaleFactor: 1,
            marginBottom: 0,
            marginTop: 0
          },
          key: `header-${item.key}`
        });
      }
    }

    return cells;
  }
}

function isGridSegment<TItem>(item: ITilesGridSegment<TItem> | ITilesHeaderItem<TItem>): item is ITilesGridSegment<TItem> {
  return !!(item as ITilesGridSegment<TItem>).items;
}
