/**
 * @core Web app entry point. Avoid editing.
 */

const APP_TITLE = 'GAS App';

export function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

export * from './api';
