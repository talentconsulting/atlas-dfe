// The page elements every view writes into, and the $ selector shorthand.

export const $ = (selector) => document.querySelector(selector);
export const sourceSelect = $('#source-select');
export const content = $('#content');
export const toolbar = $('#toolbar');
export const tabs = $('#view-tabs');
export const homeToggle = $('#home-toggle');
export const landscapeToggle = $('#landscape-toggle');
export const topicsToggle = $('#topics-toggle');
export const testDataToggle = $('#testdata-toggle');
export const serviceToggle = $('#service-toggle');
