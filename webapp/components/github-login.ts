import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-menu-button/paper-menu-button.js';
import '@polymer/paper-styles/color.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';

@customElement('github-login')
export class GitHubLogin extends LitElement {
  @property({type: String}) user: string | null = null;
  @property({type: Boolean}) isTriageMode = false;

  static styles = css`
    .login-button {
      text-transform: inherit;
    }
    .github-icon {
      margin-right: 8px;
      margin-left: 8px;
      fill: white;
    }
    .help {
      vertical-align: baseline;
    }
    .logged-in {
      display: inline-flex;
      align-items: center;
    }
  `;

  private get showTriage(): boolean {
    // Hide triage button/help icon when isTriageMode is undefined, which only
    // happens when the embedder does not pass the is-triage-mode property.
    return this.isTriageMode !== undefined;
  }

  handleLogIn() {
    const url = new URL('/login', window.location.toString());
    url.searchParams.set('return', window.location.toString());
    window.location.href = url.toString();
  }

  handleLogOut() {
    const url = new URL('/logout', window.location.toString());
    url.searchParams.set('return', window.location.toString());
    window.location.href = url.toString();
  }

  handleTriageToggle() {
    this._fireEvent('triagemode', {val: this.isTriageMode});
  }

  _fireEvent(eventName: string, detail: any) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  openHelpDialog() {
    (this.shadowRoot!.querySelector('#dialog') as any).open();
  }

  render() {
    return html`
      ${!this.user
        ? html`
            ${this.showTriage
              ? html`
                  <iron-icon
                    class="help"
                    icon="icons:help-outline"
                    @click=${this.openHelpDialog}
                  ></iron-icon>
                `
              : ''}
            <paper-button
              class="login-button"
              raised
              @click=${this.handleLogIn}
            >
              <iron-icon
                class="github-icon"
                src="/static/github.svg"
              ></iron-icon>
              Sign in with GitHub
            </paper-button>
          `
        : html`
            <div class="logged-in">
              ${this.showTriage
                ? html`
                    <paper-toggle-button
                      @click=${this.handleTriageToggle}
                      ?checked=${this.isTriageMode}
                      aria-label="Toggle Triage Mode"
                    ></paper-toggle-button>
                    Triage Mode
                  `
                : ''}
              <iron-icon
                class="github-icon"
                src="/static/github.svg"
              ></iron-icon>
              ${this.user}
              <paper-icon-button
                title="Sign out"
                icon="exit-to-app"
                @click=${this.handleLogOut}
              ></paper-icon-button>
            </div>
          `}
      <paper-dialog id="dialog">
        <h3>wpt.fyi Login</h3>
        <div>
          Logging in to wpt.fyi enables users to have a customized landing page,
          set default configurations, and triage tests from the wpt.fyi UI
        </div>
        <div>To enable the triage UI, toggle Triage Mode after login</div>
        <div class="buttons">
          <paper-button dialog-dismiss>Dismiss</paper-button>
        </div>
      </paper-dialog>
    `;
  }
}
