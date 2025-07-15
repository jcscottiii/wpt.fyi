import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import {ProductInfo, Platforms, Sources, Product} from './product-info.js';

@customElement('display-logo')
export class DisplayLogo extends ProductInfo(LitElement) {
  @property({type: Boolean}) small = false;
  @property({type: Object}) product: Product = {
    browser_name: '',
    os_name: '',
    labels: [],
  };
  @property({type: Boolean}) showSource = false;
  @property({type: Boolean}) showPlatform = false;
  @property({type: Boolean, reflect: true}) overlap = false;

  static styles = css`
    :host {
      --browser-size: 32px;
      --source-size: 16px;
    }
    .icon {
      /*Avoid (unwanted) space between images.*/
      font-size: 0;
    }
    img.browser {
      height: var(--browser-size);
      width: var(--browser-size);
    }
    img.source,
    img.platform {
      height: var(--source-size);
      width: var(--source-size);
      margin-top: var(--browser-size);
    }
    :host([overlap]) img.source {
      margin-left: calc(-0.5 * var(--source-size));
    }
    :host([overlap]) img.platform {
      margin-right: calc(-0.5 * var(--source-size));
    }
    .small {
      --browser-size: 24px;
      --source-size: 12px;
    }
  `;

  private get source(): string {
    if (!this.showSource || !this.product.labels) {
      return '';
    }
    return this.product.labels.find(s => Sources.has(s)) || '';
  }

  private get platform(): string {
    if (!this.showPlatform || !Platforms.has(this.product.os_name)) {
      return '';
    }
    return this.product.os_name;
  }

  render() {
    return html`
      <div class="icon ${this.small ? 'small' : ''}">
        ${this.platform
          ? html`<img
              class="platform"
              src="/static/${this.platform}.svg"
              alt="${this.platform} logo"
            />`
          : ''}
        <img
          class="browser"
          src=${this.displayLogo(this.product.browser_name, this.product.labels)}
          alt="${this.product.browser_name} ${this.product.labels} logo"
        />
        ${this.source
          ? html`<img
              class="source"
              src="/static/${this.source}.svg"
              alt="${this.source} logo"
            />`
          : ''}
      </div>
    `;
  }
}
