import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import '@polymer/paper-styles/color.js';

@customElement('info-banner')
export class InfoBanner extends LitElement {
  @property({type: String, reflect: true}) type = 'info';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1em;
      margin-top: 1em;
    }
    .banner {
      display: flex;
      flex-direction: row;
      justify-items: center;
      justify-content: space-between;
      background-color: var(--paper-blue-100);
      border-left: solid 4px var(--paper-blue-300);
    }
    .main {
      padding: 0.5em;
    }
    small {
      display: flex;
    }
    .banner.error {
      background-color: var(--paper-red-100);
      border-left: solid 4px var(--paper-red-300);
    }
  `;

  render() {
    return html`
      <section class="banner ${this.type}">
        <span class="main">
          <slot></slot>
        </span>
        <small>
          <slot name="small"></slot>
        </small>
      </section>
    `;
  }
}
