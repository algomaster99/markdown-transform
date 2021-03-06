/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const CommonMarkTransformer = require('@accordproject/markdown-common').CommonMarkTransformer;
const CiceroMarkTransformer = require('@accordproject/markdown-cicero').CiceroMarkTransformer;

/**
 * Prepare the text for parsing (normalizes new lines, etc)
 * @param {string} input - the text
 * @return {string} - the normalized text
 */
function normalizeNLs(input) {
    // we replace all \r and \n with \n
    let text =  input.replace(/\r/gm,'');
    return text;
}

/**
 * Normalize CommonMark to markdown text
 * @param {*} input - the CommonMark DOM
 * @return {string} - the normalized markdown text
 */
function normalizeToMarkdown(input) {
    const commonMarkTransformer = new CommonMarkTransformer();
    const result = commonMarkTransformer.toMarkdown(input);
    return result;
}

/**
 * Normalize markdown text
 * @param {string} input - the markdown text
 * @return {object} - the normalized commonmark
 */
function normalizeFromMarkdown(input) {
    // Normalizes new lines
    const inputNLs = normalizeNLs(input);
    // Roundtrip through the CommonMark parser
    const commonMarkTransformer = new CommonMarkTransformer();
    return commonMarkTransformer.fromMarkdown(inputNLs);
}

/**
 * Normalize markdown text
 * @param {string} input - the markdown text
 * @return {string} - the normalized text
 */
function normalizeCiceroMark(input) {
    // Roundtrip through the CiceroMark parser
    const ciceroMarkTransformer = new CiceroMarkTransformer();
    const result = ciceroMarkTransformer.toCommonMark(ciceroMarkTransformer.fromCommonMark(input,'json'),'json');
    return result;
}

module.exports.normalizeNLs = normalizeNLs;
module.exports.normalizeToMarkdown = normalizeToMarkdown;
module.exports.normalizeFromMarkdown = normalizeFromMarkdown;
module.exports.normalizeCiceroMark = normalizeCiceroMark;
