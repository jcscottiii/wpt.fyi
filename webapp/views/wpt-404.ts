import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-button/paper-button.js';

@customElement('wpt-404')
export class WPT404 extends LitElement {
  static styles = css`
    :host {
      display: block;
      text-align: center;
      color: var(--app-secondary-color);
    }
    iron-icon {
      display: inline-block;
      width: 60px;
      height: 60px;
    }
    h1 {
      margin: 50px 0 50px 0;
      font-weight: 300;
    }
  `;

  render() {
    return html`
      <div>
        <iron-icon icon="error"></iron-icon>
        <h1>Sorry, we couldn't find that page</h1>
      </div>
      <a href="/">
        <paper-button>Go to the home page</paper-button>
      </a>
    `;
  }
}
