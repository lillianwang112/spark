// EmberErrorBoundary — wraps AI-dependent components
// Shows sheepish Ember instead of crashing the UI
import { Component } from 'react';
import Ember from '../ember/Ember.jsx';

export default class EmberErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: err?.message || 'Something went wrong' };
  }

  componentDidCatch(err, info) {
    console.error('[EmberErrorBoundary]', err, info?.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      const { message = 'Still figuring this one out...' } = this.props.fallback || {};
      return (
        <div className="flex flex-col items-center gap-3 py-6 px-4 text-center">
          <Ember mood="sheepish" size="md" glowIntensity={0.3} />
          <p className="font-body text-text-muted text-sm">{message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-spark-ember font-body hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
