import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-icon-item.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-listbox/paper-listbox.js';
import './display-logo.js';
import {
  DefaultBrowserNames,
  DefaultProducts,
  ProductInfo,
} from './product-info.js';

// A component allowing the user to select one of a list of browsers.
@customElement('browser-picker')
export class BrowserPicker extends ProductInfo(LitElement) {
  @property({type: String}) browser = DefaultBrowserNames[0];
  @property({type: Array}) products = DefaultProducts.map(p =>
    Object.assign({}, p)
  );

  render() {
    return html`
      <paper-dropdown-menu label="Browser" no-animations>
        <paper-listbox
          slot="dropdown-content"
          .selected=${this.browser}
          attr-for-selected="value"
          @selected-changed=${(e: CustomEvent) =>
            (this.browser = e.detail.value)}
        >
          ${repeat(
            this.products,
            product => product.browser_name,
            product => html`
              <paper-icon-item .value=${product.browser_name}>
                <display-logo
                  slot="item-icon"
                  .product=${product}
                  small
                ></display-logo>
                ${this.displayName(product.browser_name)}
              </paper-icon-item>
            `
          )}
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }
}

// A component allowing the user to select multiple browsers from a list. The
// choice of browsers (passed in as |products|) is rendered as a list of
// checkboxes, which are all selected initially.
@customElement('browser-multi-picker')
export class BrowserMultiPicker extends ProductInfo(LitElement) {
  @property({type: String}) browser = DefaultBrowserNames[0];
  @property({type: Array}) products = DefaultProducts.map(p =>
    Object.assign({}, p)
  );
  @property({type: Array}) selected = DefaultProducts.map(p => p.browser_name);

  static styles = css`
    paper-checkbox {
      margin-left: 16px;
    }
    paper-checkbox div {
      display: flex;
      align-items: center;
    }
    paper-checkbox display-logo {
      margin-right: 8px;
    }
  `;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('products')) {
      this.selected = this.products.map(p => p.browser_name);
    }
  }

  selectedChanged(browser: string, e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selected.includes(browser)) {
        this.selected = [...this.selected, browser];
      }
    } else {
      this.selected = this.selected.filter(b => b !== browser);
    }
  }

  render() {
    return html`
      ${repeat(
        this.products,
        product => product.browser_name,
        product => html`
          <paper-checkbox
            checked
            .value=${product.browser_name}
            @change=${(e: Event) =>
              this.selectedChanged(product.browser_name, e)}
          >
            <div>
              <display-logo .product=${product} small></display-logo>
              ${this.displayName(product.browser_name)}
            </div>
          </paper-checkbox>
        `
      )}
    `;
  }
}
