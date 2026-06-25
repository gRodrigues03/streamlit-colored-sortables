// src/shims.d.ts

// 1. Grab the actual types from the installed @types packages globally
import ReactType = require('react');
import ReactDOMType = require('react-dom');

declare module 'react' {
  // This allows: import React from 'react'
  import entry = ReactType;
  export default entry;

  // This allows: import { useMemo, useState } from 'react'
  export = ReactType;
}

declare module 'react-dom' {
  import entry = ReactDOMType;
  export default entry;
  export = ReactDOMType;
}

declare module 'react/jsx-runtime' {
  const jsxRuntime: any;
  export = jsxRuntime;
}