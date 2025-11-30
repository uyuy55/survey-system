// components/LazyLoader.js
import React, { Suspense } from 'react';

/**
 * lazyFactory: () => import('./SomeComponent')
 * fallback: React 节点，可选
 */
const LazyLoader = (lazyFactory, fallback = <div>加载中...</div>) => {
  // 包裹一次 import，以便在控制台观察加载开始 / 完成
  const loggedFactory = () => {
    console.log('[LazyLoader] start loading', lazyFactory);
    return lazyFactory().then((mod) => {
      console.log('[LazyLoader] loaded', mod);
      return mod;
    }).catch((err) => {
      console.error('[LazyLoader] load failed', err);
      throw err;
    });
  };

  const LazyComp = React.lazy(loggedFactory);
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComp {...props} />
    </Suspense>
  );
};

export default LazyLoader;