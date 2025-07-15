import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {PathInfo} from '../components/path.js';
import '../components/test-runs-query-builder.js';
import {TestRunsUIBase} from '../components/test-runs.js';
import '../components/test-search.js';
import {WPTFlags} from '../components/wpt-flags.js';
import '../components/wpt-header.js';
import '../components/wpt-permalinks.js';
import '../components/wpt-bsf.js';
import {AppRoute} from '@polymer/app-route/app-route.js';
import {AppLocation} from '@polymer/app-route/app-location.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '../views/wpt-404.js';
import '../views/wpt-results.js';
import { WPTResults } from './wpt-results.js';

@customElement('wpt-app')
export class WPTApp extends PathInfo(WPTFlags(TestRunsUIBase)) {
  @property({type: String, reflect: true}) page = 'results';
  @property({type: String}) user = '';
  @property({type: String}) path = '';
  @property({type: Object}) testPaths = new Set();
  @property({type: Object}) structuredSearch = {};
  @property({type: Boolean}) resultsLoading = false;
  @state() private editingQuery = false;
  @state() private isBSFCollapsed = this.computeIsBSFCollapsed();
  @state() private isTriageMode = false;
  @state() private bsfStartTime: Date | null = null;
  @state() private isInteracting = false;
  @state() private subtestRowCount = 0;
  @state() private searchResults = [];
  @state() private route: any;
  @state() private subroute: any;
  @state() private routeData: any;


  private appLocation: AppLocation;
  private appRoute: AppRoute;

  constructor() {
    super();
    this.appLocation = new AppLocation();
    this.appLocation.addEventListener('route-changed', (e: any) => {
      this.route = e.detail.value;
      this._routeChanged(this.route);
    });

    this.appRoute = new AppRoute();
    this.appRoute.addEventListener('route-changed', (e: any) => {
      this.route = e.detail.value;
      this._routeChanged(this.route);
    });
    this.appRoute.addEventListener('data-changed', (e: any) => {
      this.routeData = e.detail.value;
      this._routeChanged(this.routeData);
    });
    this.appRoute.addEventListener('tail-changed', (e: any) => {
      this.subroute = e.detail.value;
      this._subrouteChanged(this.subroute);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.appLocation.setAttribute('route', '{{route}}');
    this.appLocation.setAttribute('url-space-regex', '^/(results)/');
    this.shadowRoot!.appendChild(this.appLocation);

    this.appRoute.setAttribute('route', '{{route}}');
    this.appRoute.setAttribute('pattern', '/:page');
    this.appRoute.setAttribute('data', '{{routeData}}');
    this.appRoute.setAttribute('tail', '{{subroute}}');
    this.shadowRoot!.appendChild(this.appRoute);

    const testSearch = this.shadowRoot!.querySelector('test-search');
    testSearch!.addEventListener('commit', this.handleSearchCommit.bind(this));
    testSearch!.addEventListener(
      'autocomplete',
      this.handleSearchAutocomplete.bind(this)
    );
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.addEventListener('triagemode', this.handleTriageToggle.bind(this));
  }

  disconnectedCallback() {
    const testSearch = this.shadowRoot!.querySelector('test-search');
    testSearch!.removeEventListener(
      'commit',
      this.handleSearchCommit.bind(this)
    );
    testSearch!.removeEventListener(
      'autocomplete',
      this.handleSearchAutocomplete.bind(this)
    );
    super.disconnectedCallback();
  }

  firstUpdated() {
    // Show warning about ?label=experimental missing the master label.
    const labels = this.queryParams && this.queryParams.label;
    if (
      labels &&
      labels.includes('experimental') &&
      !labels.includes('master')
    ) {
      (this.shadowRoot!.querySelector('#masterLabelMissing') as any).show();
    }
    this.addEventListener(
      'interactingchanged',
      this.bsfIsInteractingChanged as EventListener
    );
  }

  bsfIsInteractingChanged(e: CustomEvent) {
    this.isInteracting = e.detail.value;
  }

  queryChanged(query: string) {
    // app-location don't support repeated params.
    (this.appLocation as any).__query = query;
    if (this.activeView) {
      this.activeView.query = query;
    }
    super.queryChanged(query);
  }

  _routeChanged(routeData: any) {
    this.page = routeData.page || 'results';
    if (this.activeView) {
      this.activeView.query = this.query;
    }
  }

  _subrouteChanged(subroute: any) {
    this.path = subroute.path || '/';
  }

  get activeView(): WPTResults | null {
    return this.shadowRoot!.querySelector(`wpt-${this.page}`);
  }

  private get isLoading(): boolean {
    return this.resultsLoading;
  }

  handleKeyDown(e: KeyboardEvent) {
    // Ignore when something other than body has focus.
    if (e.target !== document.body) {
      return;
    }
    if (e.key === 'n') {
      this.activeView!.moveToNext();
    } else if (e.key === 'p') {
      this.activeView!.moveToPrev();
    }
  }

  handleSubmitQuery() {
    const builder = this.shadowRoot!.querySelector('test-runs-query-builder');
    this.editingQuery = false;
    this.updateQueryParams(builder!.queryParams);
  }

  handleSearchCommit(e: CustomEvent) {
    const batchUpdate = {
      search: e.detail.query,
      structuredSearch: e.detail.structuredQuery,
    };
    Object.assign(this, batchUpdate);
  }

  handleSearchAutocomplete(e: CustomEvent) {
    this.shadowRoot!.querySelector('test-search')!.clear();
    this.subroute = {...this.subroute, path: e.detail.path};
  }

  handleAddMasterLabel(e: Event) {
    const builder = this.shadowRoot!.querySelector('test-runs-query-builder');
    builder!.master = true;
    this.handleSubmitQuery();
    this.dismissToast(e);
  }

  handleTriageToggle(e: CustomEvent) {
    this.isTriageMode = e.detail.val;
  }

  handleTestRunsLoad(e: CustomEvent) {
    this.testRuns = e.detail.testRuns;
  }

  private get editable(): boolean {
    if (this.queryParams.run_id || 'max-count' in this.queryParams) {
      return false;
    }
    return true;
  }

  private get resultsTotalsRangeMessage(): string {
    const msg = super.computeResultsRangeMessage(
      this.shas,
      this.productSpecs,
      this.from,
      this.to,
      this.maxCount,
      this.labels,
      this.master,
      this.runIds
    );
    if (this.page === 'results' && this.searchResults) {
      // If the view is displaying subtests of a single test,
      // we show the number of rows excluding Harness duration.
      if (this.pathIsATestFile) {
        if (!this.subtestRowCount || this.subtestRowCount === 1) {
          return msg;
        }
        return msg.replace(
          'Showing ',
          `Showing ${this.subtestRowCount} subtests from `
        );
      }
      let subtests = 0,
        tests = 0;
      for (const r of this.searchResults) {
        if (r.test.startsWith(this.path)) {
          tests++;
          subtests += Math.max(...r.legacy_status.map((s: any) => s.total));
        }
      }
      let folder = '';
      if (this.path && this.path.length > 1) {
        folder = ` in ${this.path.substring(1)}`;
      }
      let testsAndSubtests = '';
      if (tests > 1) {
        testsAndSubtests += `${tests} tests`;
        if (subtests > 1) {
          testsAndSubtests += ` (${subtests} subtests)`;
        }
        testsAndSubtests += folder;
      }
      return msg.replace('Showing ', `Showing ${testsAndSubtests} from `);
    }
    return msg;
  }

  private get bsfBannerMessage(): string {
    const actionText = this.isBSFCollapsed ? 'expand' : 'collapse';
    return `Browser Specific Failures graph (click the arrow to ${actionText})`;
  }

  // Currently we only have BSF data for the entirety of the WPT test suite. To avoid
  // confusing the user, we only display the graph when they are looking at top-level
  // test results and hide it when in a subdirectory.
  private get showBSFGraph(): boolean {
    // Only show on the results page.
    if (this.page !== 'results') {
      return false;
    }

    // Hide when search is in use or query by run_id/sha.
    if (
      this.queryParams.q ||
      this.queryParams.run_id ||
      this.queryParams.sha
    ) {
      return false;
    }

    return this.pathIsRootDir && this.showBSF;
  }

  private computeIsBSFCollapsed(): boolean {
    const stored = this.getLocalStorageFlag('isBSFCollapsed');
    if (stored === null) {
      return false;
    }
    return stored;
  }

  private getCollapseIcon(isBSFCollapsed: boolean): string {
    if (isBSFCollapsed) {
      return '/static/expand_more.svg';
    }
    return '/static/expand_less.svg';
  }

  private togglePermalinks() {
    this.shadowRoot!.querySelector('wpt-permalinks')!.open();
  }

  private toggleQueryEdit() {
    this.editingQuery = !this.editingQuery;
  }

  private handleCollapse() {
    this.isBSFCollapsed = !this.isBSFCollapsed;
    // Record hide/open actions on the BSF graph. Currently, we only
    // show it on the homepage.
    if ('gtag' in window) {
      (window as any).gtag('event', 'visibility change', {
        event_category: 'bsf',
        event_label: this.path,
        value: this.isBSFCollapsed ? 1 : 0,
      });
    }
    this.setLocalStorageFlag(this.isBSFCollapsed, 'isBSFCollapsed');
  }

  private enterBSF() {
    // The use of isInteracting is a workaround for a known issue,
    // https://stackoverflow.com/questions/17244996/why-do-the-mouseenter-mouseleave-events-fire-when-entering-leaving-child-element;
    // when users interact with the BSF chart itself, enterBSF is triggered unexpectedly.
    // In that case, isInteracting is set to true to avoid resetting bsfStartTime.
    if (this.isInteracting) {
      return;
    }
    this.bsfStartTime = new Date();
  }

  private exitBSF() {
    // Similarly, when users interact with the BSF chart, isInteracting is set to
    // true to avoid sending analytics prematurely in exitBSF.
    if (this.isInteracting || !this.bsfStartTime) {
      return;
    }
    const diff = new Date().getTime() - this.bsfStartTime.getTime();
    const duration = Math.round(diff / 1000);
    if (duration <= 0) {
      return;
    }

    if ('gtag' in window) {
      (window as any).gtag('event', 'hover', {
        event_category: 'bsf',
        event_label: this.path,
        value: duration,
      });
    }
    this.bsfStartTime = null;
  }

  private dismissToast(e: Event) {
    (e.target as HTMLElement).closest('paper-toast')!.close();
  }

  static styles = css`
    section.search {
      position: relative;
    }
    section.search .path {
      margin-top: 1em;
    }
    section.search paper-spinner-lite {
      position: absolute;
      top: 0;
      right: 0;
    }
    a {
      color: #0d5de6;
      text-decoration: none;
    }
    .separator {
      border-bottom: solid 1px var(--paper-grey-300);
      padding-bottom: 1em;
      margin-bottom: 1em;
    }
    .path {
      margin-bottom: 16px;
    }
    .path-separator {
      padding: 0 0.1em;
      margin: 0 0.2em;
    }
    .links {
      margin-bottom: 1em;
    }
    test-runs-query-builder {
      display: block;
      margin-bottom: 32px;
    }
    .query-actions paper-button {
      display: inline-block;
    }
    paper-icon-button {
      vertical-align: middle;
      margin-right: 10px;
      padding: 0px;
      height: 28px;
    }
  `;

  render() {
    return html`
      <wpt-header
        .path=${this.encodedPath}
        .query=${this.query}
        .user=${this.user}
        ?is-triage-mode=${this.isTriageMode}
      ></wpt-header>

      <section class="search">
        <div class="path">
          <a href="/${this.page}/?${this.query}">wpt</a>
          ${repeat(
            this.splitPathIntoLinkedParts(this.path),
            part => part.path,
            part => html`
              <span class="path-separator">/</span
              ><a href="/${this.page}${part.path}?${this.query}"
                >${part.name}</a
              >
            `
          )}
        </div>

        <paper-spinner-lite
          ?active=${this.isLoading}
          class="blue"
        ></paper-spinner-lite>

        <test-search
          .query=${this.search}
          .structuredQuery=${this.structuredSearch}
          .testRuns=${this.testRuns}
          .testPaths=${this.testPaths}
        >
        </test-search>

        ${this.pathIsATestFile
          ? html`
              <div class="links">
                <ul>
                  <li>
                    View source on GitHub
                    (<a
                      href="https://github.com/web-platform-tests/wpt/blob/${this
                        .testRuns[0]
                        .revision}${this.path}"
                      target="_blank"
                      >current commit</a
                    >)
                    (<a
                      href="https://github.com/web-platform-tests/wpt/blob/master${this
                        .path}"
                      target="_blank"
                      >master branch</a
                    >)
                  </li>

                  ${!this.webPlatformTestsLive
                    ? html`
                        <li>
                          <a
                            href="${this.scheme}://w3c-test.org${this.path}"
                            target="_blank"
                            >Run in your browser on w3c-test.org</a
                          >
                        </li>
                      `
                    : ''}
                  ${this.webPlatformTestsLive
                    ? html`
                        <li>
                          <a
                            href="${this.scheme}://wpt.live${this.path}"
                            target="_blank"
                            >Run in your browser on wpt.live</a
                          >
                        </li>
                      `
                    : ''}
                </ul>
              </div>
            `
          : ''}
      </section>

      <div class="separator"></div>

      ${this.showBSFGraph
        ? html`
            <div @mouseenter=${this.enterBSF} @mouseleave=${this.exitBSF}>
              <info-banner>
                <paper-icon-button
                  src=${this.getCollapseIcon(this.isBSFCollapsed)}
                  @click=${this.handleCollapse}
                  aria-label="Hide BSF graph"
                ></paper-icon-button>
                ${this.bsfBannerMessage}
              </info-banner>
              ${!this.isBSFCollapsed
                ? html`
                    <iron-collapse ?opened=${!this.isBSFCollapsed}>
                      <wpt-bsf
                        ?is-interacting=${this.isInteracting}
                        @interactingchanged=${this.bsfIsInteractingChanged}
                      ></wpt-bsf>
                    </iron-collapse>
                  `
                : ''}
            </div>
          `
        : ''}
      ${this.resultsTotalsRangeMessage
        ? html`
            <info-banner>
              ${this.resultsTotalsRangeMessage}
              ${!this.editable
                ? html`
                    <a href="javascript:window.location.search='';"
                      >(switch to the default product set instead)</a
                    >
                  `
                : ''}
              <wpt-permalinks
                .path=${this.path}
                .pathPrefix="/${this.page}/"
                .queryParams=${this.queryParams}
                .testRuns=${this.testRuns}
              >
              </wpt-permalinks>
              <paper-button @click=${this.togglePermalinks} slot="small"
                >Link</paper-button
              >
              <paper-button
                @click=${this.toggleQueryEdit}
                slot="small"
                ?hidden=${!this.editable}
                >Edit</paper-button
              >
            </info-banner>
          `
        : ''}
      <iron-collapse ?opened=${this.editingQuery}>
        <test-runs-query-builder
          .queryParams=${this.queryParams}
          @submit=${this.handleSubmitQuery}
        ></test-runs-query-builder>
      </iron-collapse>

      <iron-pages
        role="main"
        selected="${ifDefined(this.page)}"
        attr-for-selected="name"
        selected-attribute="visible"
        fallback-selection="404"
      >
        <wpt-results
          name="results"
          ?is-loading=${this.resultsLoading}
          .structuredSearch=${this.structuredSearch}
          .path=${this.subroute?.path}
          .testRuns=${this.testRuns}
          .testPaths=${this.testPaths}
          .searchResults=${this.searchResults}
          .subtestRowCount=${this.subtestRowCount}
          ?is-triage-mode=${this.isTriageMode}
          @testrunsload=${this.handleTestRunsLoad}
          .view=${this.view}
        ></wpt-results>

        <wpt-404 name="404"></wpt-404>
      </iron-pages>

      <paper-toast id="masterLabelMissing" duration="15000">
        <div style="display: flex;">
          wpt.fyi now includes affected tests results from PRs. <br />
          Did you intend to view results for complete (master) runs only?
          <paper-button @click=${this.handleAddMasterLabel}
            >View master runs</paper-button
          >
          <paper-button @click=${this.dismissToast}>Dismiss</paper-button>
        </div>
      </paper-toast>
    `;
  }
}
