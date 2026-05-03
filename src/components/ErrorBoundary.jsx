import React from 'react';

/**
 * Wraps the 3D Canvas so that a WebGL crash doesn't
 * unmount the entire app (navbar, sections still show).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('[3D Scene] WebGL error caught by boundary:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render a plain cream background fallback — site still usable
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#F2EFE9',
            zIndex: 0,
          }}
          aria-hidden="true"
        />
      );
    }
    return this.props.children;
  }
}
