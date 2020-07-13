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

const xmljs = require('xml-js');
const typeOf = require('type-of');
const { NS_PREFIX_CommonMarkModel } = require('@accordproject/markdown-common').CommonMarkModel;

/**
 * Transforms OOXML to CiceroMark
 */
class OoxmlTransformer {
    /**
     * Gets the id of the variable
     * 
     * @param {Array} elements the variable elements
     * @returns {string} the name/id of the variable
     */
    getId(elements) {
        const variableProperties = elements[0]
        for (const property of variableProperties.elements) {
            if (property.name === 'w:tag') {
                return property.attributes['w:val'];
            }
        }
    }

    /**
     * Gets the value of the variable
     * 
     * @param {Array} elements the variable elements
     * @returns {string} the value of the variable
     */
    getValue(elements) {
        const variableContents = elements[1]
        for (const property of variableContents.elements[0].elements) {
            if (property.name === 'w:t') {
                return property.elements[0].text;
            }
        }
    }

    /**
     * Return the node after parsing each element
     * 
     * @param {object} element the element of the document node
     * @returns {Array|object} the nodes 
     */
    deserializeElement(element) {
        switch (element.name) {
            case 'w:p':
                return {
                    $class: `${NS_PREFIX_CommonMarkModel}Paragraph`,
                    nodes: this.deserializeElements(element.elements)
                }
            case 'w:sdt':
                return {
                    $class: `${NS_PREFIX_CommonMarkModel}Variable`,
                    id: this.getId(element.elements),
                    value: this.getValue(element.elements),
                }
            
            case 'w:r':
                return [...this.deserializeElements(element.elements)]
            case 'w:color':
                return element.attributes['w:color'];
            // once line break is added in Common Mark
            // case 'w:br':
            //     return {
            //         $class: `${NS_PREFIX_CommonMarkModel}LineBreak`,  
            //     }
            case 'w:t':
                if (element.elements === undefined && element.attributes['xml:space'] === 'preserve') {
                    return {
                        $class: `${NS_PREFIX_CommonMarkModel}Softbreak`,
                    }
                }
                return {
                    $class: `${NS_PREFIX_CommonMarkModel}Text`,
                    text: element.elements[0].text
                }
            default:
                return this.deserializeElements(element.elements)
        }
    }

    /**
     * Gets the CiceroMark JSON object
     * 
     * @param {Array} elements the root node
     * @returns {object} the CiceroMark object
     */
    deserializeElements(elements) {
        let nodes = [];
    
        for (const element of elements) {
            if (element.name === 'w:pPr') {
                continue;
            }
            const node = this.deserializeElement(element)
            switch (typeOf(node)) {
                case 'array':
                    nodes = [...nodes, ...node];
                    break;
                case 'object':
                    nodes = [...nodes, node];
                    break;
            }
        }

        return nodes;
    }

    /**
     * Transform OOXML -> CiceroMark
     * 
     * @param {string} input the ooxml string
     * @param {string} pkgName the package name of the xml to be converted
     * @returns {string} CiceroMark object
     */
    toCiceroMark(input, pkgName='/word/document.xml') {
        // Parses the OOXML 'test/data/ooxml/document.xml' to JSON
        const convertedJSObject = xmljs.xml2js(input, {
            ignoreDeclaration: true,
            ignoreInstruction: true,
        });
        const rootNode = convertedJSObject.elements[0].elements;
        let documentNode;
        for (const node of rootNode) {
            if (node.attributes['pkg:name'] === pkgName) {
                // Gets the document node
                // https://gist.github.com/algomaster99/56b37d43b22bdf9e1d5c25c5d5cb6e5e
                // we shall be iterating over this Gist
                documentNode = node.elements[0].elements[0]
                break;
            }
        }
        const nodes = this.deserializeElements(documentNode.elements);
        // the output:
        // https://gist.github.com/algomaster99/1986e9c08f6f3089a563846b2ff54321
        return {
            '$class': `${NS_PREFIX_CommonMarkModel}${'Document'}`,
            nodes,
            xmlns: 'http://commonmark.org/xml/1.0',
        };
    }
}

module.exports = OoxmlTransformer;