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

// Basic parser constructors
const textParser = require('./coreparsers').textParser;
const doubleParser = require('./coreparsers').doubleParser;
const integerParser = require('./coreparsers').integerParser;
const stringParser = require('./coreparsers').stringParser;
const dateTimeParser = require('./dateTimeParser').dateTimeParser;
const enumParser = require('./coreparsers').enumParser;
const seqParser = require('./coreparsers').seqParser;
const condParser = require('./coreparsers').condParser;
const listParser = require('./coreparsers').listParser;
const withParser = require('./coreparsers').withParser;
const clauseParser = require('./coreparsers').clauseParser;
const wrappedClauseParser = require('./coreparsers').wrappedClauseParser;
const contractParser = require('./coreparsers').contractParser;

/**
 * Parsing table for variables
 * This maps types to their parser
 */
const parsingTable = {
    'Integer' : integerParser,
    'Double' : doubleParser,
    'String' : stringParser,
    'DateTime' : dateTimeParser,
};

/**
 * Creates a parser for Double
 * @param {object} ast - the template AST
 * @returns {object} the parser
 */
function parserOfTemplate(ast,params) {
    let parser = null;
    switch(ast.$class) {
    case 'org.accordproject.ciceromark.template.TextChunk' : {
        parser = textParser(ast.value);
        break;
    }
    case 'org.accordproject.ciceromark.template.Variable' : {
        switch(ast.type) {
        case 'Enum' :
            parser = enumParser(ast,ast.value);
            break;
        default: {
            const parserFun = parsingTable[ast.type];
            if (parserFun) {
                parser = parserFun(ast);
            } else {
                throw new Error('Unknown variable type ' + ast.type);
            }
        }
        }
        break;
    }
    case 'org.accordproject.ciceromark.template.ConditionalBlock' : {
        parser = condParser(ast);
        break;
    }
    case 'org.accordproject.ciceromark.template.UnorderedListBlock' : {
        const childrenParser = seqParser(ast.nodes.map(function (x) { return parserOfTemplate(x,params); }));
        parser = listParser(ast,childrenParser);
        break;
    }
    case 'org.accordproject.ciceromark.template.ClauseBlock' : {
        const childrenParser = seqParser(ast.nodes.map(function (x) { return parserOfTemplate(x,params); }));
        if (params.contract) {
            parser = wrappedClauseParser(ast,childrenParser);
        } else {
            parser = clauseParser(ast,childrenParser);
        }
        break;
    }
    case 'org.accordproject.ciceromark.template.WithBlock' : {
        const childrenParser = seqParser(ast.nodes.map(function (x) { return parserOfTemplate(x,params); }));
        parser = withParser(ast,childrenParser);
        break;
    }
    case 'org.accordproject.ciceromark.template.ContractBlock' :
        params.contract = true;
        const childrenParser = seqParser(ast.nodes.map(function (x) { return parserOfTemplate(x,params); }));
        parser = contractParser(ast,childrenParser);
        break;
    default:
        throw new Error('Unknown template ast $class ' + ast.$class);
    }
    return parser;
};

module.exports.parserOfTemplate = parserOfTemplate;
