import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-icon-item.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-listbox/paper-listbox.js';
import './display-logo.js';
import {Channels, DefaultBrowserNames, ProductInfo} from './product-info.js';

@customElement('channel-picker')
export class ChannelPicker extends ProductInfo(LitElement) {
  @property({type: String}) browser = DefaultBrowserNames[0];
  @property({type: String}) channel = 'stable';
  @property({type: Array}) channels = Array.from(Channels);

  productWithChannel(browser: string, channel: string) {
    return {
      browser_name: browser,
      labels: [channel],
    };
  }

  render() {
    return html`
      <paper-dropdown-menu label="Channel" no-animations>
        <paper-listbox
          slot="dropdown-content"
          .selected=${this.channel}
          attr-for-selected="value"
          @selected-changed=${(e: CustomEvent) =>
            (this.channel = e.detail.value)}
        >
          <paper-item value="any">Any</paper-item>
          ${repeat(
            this.channels,
            channel => channel,
            channel => html`
              <paper-icon-item .value=${channel}>
                <display-logo
                  slot="item-icon"
                  .product=${this.productWithChannel(this.browser, channel)}
                  small
                ></display-logo>
                ${this.displayName(channel)}
              </paper-icon-item>
            `
          )}
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }
}
