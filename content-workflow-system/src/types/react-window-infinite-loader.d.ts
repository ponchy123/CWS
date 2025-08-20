declare module 'react-window-infinite-loader' {
  import * as React from 'react';

  interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: (
      startIndex: number,
      stopIndex: number
    ) => Promise<void> | void;
    children: (props: {
      onItemsRendered: (props: {
        visibleStartIndex: number;
        visibleStopIndex: number;
        overscanStartIndex: number;
        overscanStopIndex: number;
      }) => void;
      ref: React.Ref<unknown>;
    }) => React.ReactNode;
    threshold?: number;
    minimumBatchSize?: number;
  }

  export default class InfiniteLoader extends React.Component<InfiniteLoaderProps> {}
}
