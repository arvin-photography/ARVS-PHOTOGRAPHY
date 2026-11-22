import { Component } from 'react';

/* If WebGL is unavailable or the 3D scene crashes, keep the rest of the site alive:
   the hero still shows the masthead and copy, and the scroll story still runs. */
export default class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('[3D] disabled:', err?.message || err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
