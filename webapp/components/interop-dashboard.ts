/**
 * Copyright 2023 The WPT Dashboard Project. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import { InteropDataManager } from './interop-data-manager.js';
import { WPTFlags } from './wpt-flags.js';
import '../node_modules/@polymer/paper-button/paper-button.js';
import '../node_modules/@polymer/polymer/lib/elements/dom-if.js';
import '../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import { html, PolymerElement } from '../node_modules/@polymer/polymer/polymer-element.js';
import { afterNextRender } from '../node_modules/@polymer/polymer/lib/utils/render-status.js';

import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {classMap} from 'lit/directives/class-map.js';

// InteropDashboard is a custom element that holds the overall interop dashboard.
// The dashboard breaks down into top-level summary scores, a small description,
// graphs per feature, and a table of currently tracked tests.
@customElement('interop-dashboard')
export class InteropDashboard extends WPTFlags(LitElement) {
  @property({type: String}) year = '';
  @property({type: Boolean}) embedded = false;
  @property({type: Boolean}) stable = false;
  @property({type: String}) feature = '';
  @state() private features: {id: string}[] = [];
  @state() private dataManager!: InteropDataManager;
  @state() private scores: any = {};
  @state() private sortColumn = 0;
  @state() private dashboardTitle = '';
  @state() private currentInteropYear = 0;
  @state() private isCurrentYear = true;
  @state() private isMobileScoresView = false;
  @state() private isSortedAsc = true;
  @state() private totalChromium = '0%';
  @state() private totalFirefox = '0%';
  @state() private totalSafari = '0%';
  @state() private focusAreasDescriptionLink = '';

  async connectedCallback() {
    super.connectedCallback();
    const params = new URL(document.location.toString()).searchParams;

    this.stable = params.get('stable') !== null;
    this.isMobileScoresView =
      params.get('mobile-view') !== null && this.showMobileScoresView;
    this.dataManager = new InteropDataManager(this.year, this.isMobileScoresView);

    if (this.isMobileScoresView) {
      this.dashboardTitle = `Interop ${this.year} Mobile Dashboard`;
      // No stable view for mobile results.
      this.stable = false;
    } else {
      this.dashboardTitle = `Interop ${this.year} Dashboard`;
    }

    this.scores = {};
    this.scores.experimental = await this.dataManager.getMostRecentScores(false);
    this.scores.stable = await this.dataManager.getMostRecentScores(true);

    this.features = Object.entries(this.getYearProp('focusAreas')).map(
      ([id, info]) => Object.assign({id}, info)
    );

    // Determine the current Interop year. It is assumed that
    // the current year is the latest year defined in interop-data.
    // allYears is returned sorted. The last index is the current Interop year.
    const allYears = this.getAllYears();
    this.currentInteropYear = allYears[allYears.length - 1];
    this.isCurrentYear = this.year === this.currentInteropYear.toString();
    this.focusAreasDescriptionLink =
      this.dataManager.getYearProp('focusAreasDescriptionLink');

    this.embedded = params.get('embedded') !== null;
    // The default view of the page is the summary scores graph for
    // experimental releases of browsers.
    this.feature =
      params.get('feature') || this.getYearProp('summaryFeatureName');

    const featureSelect = this.shadowRoot!.querySelector(
      '#featureSelect'
    ) as HTMLSelectElement;
    featureSelect.value = this.feature;
    featureSelect.addEventListener('change', () => {
      this.feature = featureSelect.value;
    });

    const toggleStable = this.shadowRoot!.querySelector(
      '#toggleStable'
    ) as HTMLElement;
    toggleStable.setAttribute('aria-pressed', this.stable.toString());
    const toggleExperimental = this.shadowRoot!.querySelector(
      '#toggleExperimental'
    ) as HTMLElement;
    toggleExperimental.setAttribute('aria-pressed', (!this.stable).toString());

    // Keep the block-level design for interop 2021-2022
    if (
      this.year === '2021' ||
      this.year === '2022' ||
      this.isMobileScoresView
    ) {
      const gridContainerDiv = this.shadowRoot!.querySelector(
        '.grid-container'
      ) as HTMLDivElement;
      gridContainerDiv.style.display = 'block';
      gridContainerDiv.style.width = '700px';
      gridContainerDiv.style.margin = 'auto';
      // Dashboards after 2022 also display a special description,
      // which is not displayed in previous years.
      const extraDescriptionDiv = this.shadowRoot!.querySelector(
        '.extra-description'
      ) as HTMLDivElement;
      extraDescriptionDiv.style.display = 'none';
    }
    this.addSortEvents();
  }

  updated(changedProperties: Map<string, any>) {
    if (
      changedProperties.has('embedded') ||
      changedProperties.has('stable') ||
      changedProperties.has('feature') ||
      changedProperties.has('isMobileScoresView')
    ) {
      this.updateUrlParams();
    }
    if (changedProperties.has('features') || changedProperties.has('stable')) {
      this.updateTotals();
    }
  }

  // Add the on-click handlers for sorting by a specific table header.
  addSortEvents() {
    const sortableHeaders = this.shadowRoot.querySelectorAll('.sortable-header');
    sortableHeaders.forEach((header, i) => header.addEventListener('click', () => this.handleSortClick(i)));
  }

  isSelected(feature) {
    return feature === this.feature;
  }

  featureLinks(feature, stable) {
    const data = this.getYearProp('focusAreas')[feature];
    const rawURL = (this.isMobileScoresView) ? data?.mobile_tests : data?.tests;
    const testsURL = this.formatTestsURL(rawURL, stable);

    return [
      { text: 'Spec', href: data?.spec },
      { text: 'MDN', href: data?.mdn },
      { text: 'Tests', href: testsURL },
    ];
  }

  filterGroupSections() {
    return (section) => !section.score_as_group;
  }

  getRowInfo(name, prop) {
    return this.getYearProp('focusAreas')[name][prop];
  }

  // Add the stable or experimental label to a tests URL depending on the view.
  formatTestsURL(testsURL, stable) {
    // Don't try to add a label if the URL is undefined or empty.
    if (!testsURL) {
      return '';
    }

    // TODO(DanielRyanSmith): This logic could be simplified. see:
    // - https://github.com/whatwg/url/issues/762
    // - https://github.com/whatwg/url/issues/461
    // - https://github.com/whatwg/url/issues/335
    // Test results are defined as absolute paths from this origin.
    const url = new URL(testsURL, window.location.origin);
    // Test results URLs can have multiple 'label' params. Grab them all.
    const existingLabels = url.searchParams.getAll('label');
    // Remove any existing stable or experimental label param.
    const newLabels = existingLabels.filter(val => val !== 'stable' && val !== 'experimental');
    // Add the stable/experimental label depending on the dashboard view.
    newLabels.push(stable ? 'stable' : 'experimental');
    // Delete the existing label params and re-add them.
    url.searchParams.delete('label');
    for (const labelValue of newLabels) {
      url.searchParams.append('label', labelValue);
    }

    return url.toString();
  }

  // Get the tests URL for a row and add the stable/experimental label.
  getTestsURL(name, stable) {
    const urlKey = (this.isMobileScoresView) ? 'mobile_tests' : 'tests';
    return this.formatTestsURL(this.getRowInfo(name, urlKey), stable);
  }

  getInvestigationScore(rowName, isPreviousYear) {
    const yearProp = (isPreviousYear) ? 'previousInvestigationScores' : 'investigationScores';
    const scores = this.getYearProp(yearProp);
    for (let i = 0; i < scores.length; i++) {
      const area = scores[i];
      if (area.name === rowName && area.scores_over_time.length > 0) {
        const score = area.scores_over_time[area.scores_over_time.length - 1].score;
        return `${(score / 10).toFixed(1)}%`;
      }
    }

    return '0.0%';
  }

  getInvestigationUrl(rowName, isPreviousYear) {
    const yearProp = (isPreviousYear) ? 'previousInvestigationScores' : 'investigationScores';
    const scores = this.getYearProp(yearProp);
    for (let i = 0; i < scores.length; i++) {
      const area = scores[i];
      if (area.name === rowName) {
        return area.url;
      }
    }

    return '#';
  }

  getInvestigationScoreSubtotal(isPreviousYear) {
    const yearProp = (isPreviousYear) ? 'previousInvestigationTotalScore' : 'investigationTotalScore';
    const total = this.getYearProp(yearProp);
    if (!total) {
      return '0.0%';
    }
    return `${(total / 10).toFixed(1)}%`;
  }

  getSubtotalScore(browserIndex, section, stable) {
    const scores = stable ? this.scores.stable : this.scores.experimental;
    const totalScore = section.rows.reduce((sum, rowName) => {
      return sum + scores[browserIndex][rowName];
    }, 0);
    const avg = Math.floor(totalScore / section.rows.length) / 10;
    // Don't display decimal places for a 100% score.
    if (avg >= 100) {
      return '100%';
    }
    return `${avg.toFixed(1)}%`;
  }

  getInteropSubtotalScore(section, isStable) {
    const numBrowsers = this.getYearProp('numBrowsers');
    const score = this.getSubtotalScore(numBrowsers, section, isStable);
    return score;
  }

  getSummaryOptionText() {
    // Show "Active" in graph summary text if it is the current interop year.
    if (parseInt(this.year) === new Date().getFullYear()) {
      return 'All Active Focus Areas';
    }
    return 'All Focus Areas';
  }

  showBrowserIcons(index, scoreAsGroup) {
    return index === 0 || !scoreAsGroup;
  }

  showNoOtherColumns(scoreAsGroup, index) {
    return !scoreAsGroup && !this.showBrowserIcons(index);
  }

  getBrowserScoreForFeature(browserIndex, feature) {
    const scores = this.stable ? this.scores.stable : this.scores.experimental;
    const score = scores[browserIndex][feature];
    // Don't display decimal places for a 100% score.
    if (score / 10 >= 100) {
      return '100%';
    }
    return `${(score / 10).toFixed(1)}%`;
  }

  getInteropScoreForFeature(feature, isStable) {
    const numBrowsers = this.getYearProp('numBrowsers');
    return this.getBrowserScoreForFeature(numBrowsers, feature, isStable);
  }

  // getNumericalBrowserScoreByFeature returns the same score as
  // getBrowserScoreForFeature but as a number instead of a string
  getNumericalBrowserScoreByFeature(browserIndex, feature) {
    const scores = this.stable ? this.scores.stable : this.scores.experimental;
    const score = scores[browserIndex][feature];
    const roundedScore = Math.round(score * 100) / 100;
    return roundedScore / 10;
  }

  getBrowserScoreTotal(browserIndex) {
    return this.totals[browserIndex];
  }

  getAllYears() {
    return this.dataManager.getYearProp('validYears').sort();
  }

  getYearProp(prop) {
    return this.dataManager.getYearProp(prop);
  }

  updateTotals() {
    if (!this.features) {
      return;
    }

    const summaryFeatureName = this.getYearProp('summaryFeatureName');
    this.totalChromium = this.getBrowserScoreForFeature(0, summaryFeatureName);
    this.totalFirefox = this.getBrowserScoreForFeature(1, summaryFeatureName);
    this.totalSafari = this.getBrowserScoreForFeature(2, summaryFeatureName);
  }

  updateUrlParams() {
    // Our observer may be called before the feature is set, so debounce that.
    if (this.feature === undefined) {
      return;
    }

    const params = [];
    if (this.feature && this.feature !== this.getYearProp('summaryFeatureName')) {
      params.push(`feature=${this.feature}`);
    }
    if (this.stable) {
      params.push('stable');
    }
    if (this.embedded) {
      params.push('embedded');
    }
    if (this.isMobileScoresView) {
      params.push('mobile-view');
    }

    let url = location.pathname;
    if (params.length) {
      url += `?${params.join('&')}`;
    }
    history.pushState('', '', url);
  }

  experimentalButtonClass() {
    return classMap({
      unselected: this.isMobileScoresView || this.stable,
      selected: !this.isMobileScoresView && !this.stable,
    });
  }

  stableButtonClass() {
    return classMap({
      selected: this.stable && !this.isMobileScoresView,
      unselected: !this.stable || this.isMobileScoresView,
    });
  }

  mobileButtonClass() {
    return classMap({
      selected: this.isMobileScoresView,
      unselected: !this.isMobileScoresView,
    });
  }

  clickExperimental() {
    if (!this.stable && !this.isMobileScoresView) {
      return;
    }
    if (this.isMobileScoresView) {
      this.toggleMobileView(false, false);
    } else {
      this.stable = false;
      this.isMobileScoresView = false;
      const toggleStable = this.shadowRoot!.querySelector(
        '#toggleStable'
      ) as HTMLElement;
      toggleStable.setAttribute('aria-pressed', 'false');
      const toggleExperimental = this.shadowRoot!.querySelector(
        '#toggleExperimental'
      ) as HTMLElement;
      toggleExperimental.setAttribute('aria-pressed', 'true');
    }
  }

  clickStable() {
    if (this.stable && !this.isMobileScoresView) {
      return;
    }
    if (this.isMobileScoresView) {
      this.toggleMobileView(false, true);
    } else {
      this.stable = true;
      this.isMobileScoresView = false;
      const toggleStable = this.shadowRoot!.querySelector(
        '#toggleStable'
      ) as HTMLElement;
      toggleStable.setAttribute('aria-pressed', 'true');
      const toggleExperimental = this.shadowRoot!.querySelector(
        '#toggleExperimental'
      ) as HTMLElement;
      toggleExperimental.setAttribute('aria-pressed', 'false');
    }
  }

  clickMobile() {
    if (this.isMobileScoresView) {
      return;
    }
    this.toggleMobileView(true, false);
  }

  toggleMobileView(showMobileScores: boolean, stable: boolean) {
    let queryString = '';
    if (showMobileScores) {
      queryString += 'mobile-view';
    }
    if (stable) {
      queryString += (queryString.length ? '&' : '') + 'stable';
    }
    if (queryString.length) {
      queryString = `?${queryString}`;
    }

    const url = `${location.pathname}${queryString}`;
    window.location.href = url;
  }

  shouldShowMobileScoresView() {
    const validYears = this.dataManager.getYearProp('validMobileYears');
    return this.showMobileScoresView && validYears.includes(this.year);
  }

  // Check if the table being rendered is the first table.
  isFirstTable(tableIndex) {
    return tableIndex === 0;
  }

  shouldShowFocusAreasDescriptionLink(tableIndex) {
    return this.isFirstTable(tableIndex) && !!this.focusAreasDescriptionLink;
  }

  shouldShowSortIcon(columnNumber, sortColumn) {
    return columnNumber === sortColumn;
  }

  // Determine the icon that should be displayed on the focus area column.
  getFocusAreaSortIcon(sortColumn, isSortedAsc) {
    if (sortColumn !== 0) {
      return '/static/expand_inactive.svg';
    }
    if (isSortedAsc) {
      return '/static/expand_less.svg';
    }
    return '/static/expand_more.svg';
  }

  // Determine the icon that should be displayed on the interop column.
  getInteropSortIcon(sortColumn, isSortedAsc) {
    const indexOffset = (this.isMobileScoresView) ? 2 : 1;
    const interopIndex = this.dataManager.getYearProp('numBrowsers') + indexOffset;
    if (interopIndex !== sortColumn) {
      return '/static/expand_inactive.svg';
    }
    if (isSortedAsc) {
      return '/static/expand_less.svg';
    }
    return '/static/expand_more.svg';
  }

  // Determine the arrow to display to distinguish which column is sorted, and how.
  getSortIcon(index, sortColumn, isSortedAsc) {
    // Browser scores columns start at index 1, so we offset the given index by 1.
    index++;
    if (sortColumn !== index) {
      return '/static/expand_inactive.svg';
    }
    if (isSortedAsc) {
      return '/static/expand_less.svg';
    }
    return '/static/expand_more.svg';
  }

  alphabeticalSort = (rows, featureOrder) => {
    const rowNames = [];
    for(let i = 0; i < rows.length; i++) {
      const feature = rows[i];
      rowNames[i] = [feature, this.getRowInfo(feature, 'description').replace(/\W/g, '')];
    }
    rowNames.sort((a, b) => a[1].localeCompare(b[1]));
    for (let i = 0; i < rowNames.length; i++) {
      featureOrder[i] = rowNames[i][0];
    }
  };

  numericalSort = (rows, featureOrder, sortColumn) => {
    const browserIndex = (this.isMobileScoresView && sortColumn === 4) ? 2 : sortColumn - 1;
    const individualScores = [];
    for (let i = 0; i < rows.length; i++) {
      const feature = rows[i];
      individualScores[i] = [feature, this.getNumericalBrowserScoreByFeature(browserIndex, feature)];
    }
    individualScores.sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < individualScores.length; i++) {
      featureOrder[i] = individualScores[i][0];
    }
  };

  sortRows = (rows, index, sortColumn, isSortedAsc) => {
    if(index !== 0) {
      return rows;
    }
    // Safari column will not have data for mobile and cannot be sorted.
    if (this.isMobileScoresView && sortColumn === 3) {
      return rows;
    }
    const sortedFeatureOrder = [];
    // For the first column, sort alphabetically by name
    if(sortColumn === 0) {
      this.alphabeticalSort(rows, sortedFeatureOrder);
    } else {
      // For the other columns, sort numerically by score
      this.numericalSort(rows, sortedFeatureOrder, sortColumn);
    }

    // Reverse current sort order
    if (!isSortedAsc) {
      sortedFeatureOrder.reverse();
    }
    return sortedFeatureOrder;
  };

  // Checks if this section is displaying the Chrome/Edge combo together.
  isChromeEdgeCombo(browserInfo) {
    return browserInfo.tableName === 'Chrome/Edge';
  }

  getBrowserIcon(browserInfo, isStable) {
    const icon = (isStable) ? browserInfo.stableIcon : browserInfo.experimentalIcon;
    return `/static/${icon}_64x64.png`;
  }

  getBrowserIconName(browserInfo, isStable) {
    if (isStable) {
      return browserInfo.tableName;
    }
    return `${browserInfo.tableName} ${browserInfo.experimentalName}`;
  }

  // Handle the table header click to sort a column.
  handleSortClick = (i) => {
    // Reverse the sort order if the same column is clicked again.
    if (this.sortColumn === i) {
      this.isSortedAsc = !this.isSortedAsc;
    } else  {
      // Otherwise, sort in descending order.
      this.isSortedAsc = false;
    }
    this.sortColumn = i;
  };
}
export { InteropDashboard };
