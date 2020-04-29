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

const P = require('parsimmon');

/**
 * Utilities
 */

/**
 * Creates a variable output
 * @param {object} variable the variable ast node
 * @param {*} value the variable value
 * @returns {object} the variable
 */
function mkVariable(variable,value) {
    const result = {};
    result.name = variable.name;
    result.type = variable.type;
    result.value = value;
    return result;
}

/**
 * Creates a compound variable output
 * @param {object} variable the variable ast node
 * @param {*} value the variable components
 * @returns {object} the compound variable
 */
function mkCompoundVariable(variable,value) {
    const result = {};
    result.$class = variable.type;
    for(let i = 0; i < value.length; i++) {
        const field = value[i];
        result[field.name] = field.value;
    }
    return result;
}

/**
 * Creates a conditional output
 * @param {object} variable the variable ast node
 * @param {*} value the variable value
 * @returns {object} the conditional
 */
function mkCond(cond,value) {
    const result = {};
    result.name = cond.name;
    result.type = 'Boolean';
    result.value = value === cond.whenTrue ? true : false;
    return result;
}

/**
 * Creates a clause output
 * @param {object} clause the clause ast node
 * @param {*} value the clause value
 * @returns {object} the clause
 */
function mkClause(clause,value) {
    return mkCompoundVariable(clause,value);
}

/**
 * Creates a wrapped clause output
 * @param {object} clause the wrapped clause ast node
 * @param {*} value the wrapped clause value
 * @returns {object} the clause
 */
function mkWrappedClause(clause,value) {
    return {'name':clause.name,'type':clause.type,'value':mkClause(clause,value)};
}

/**
 * Creates a contract output
 * @param {object} contract the contract ast node
 * @param {*} value the contract value
 * @returns {object} the contract
 */
function mkContract(contract,value) {
    return mkClause(contract,value); // XXX Need to be changed
}

/**
 * Core parsing components
 */

/**
 * Creates a parser for Text blocks
 * @param {string} text the text
 * @returns {object} the parser
 */
function textParser(text) {
    return P.string(text);
}

/**
 * Creates a parser for a String
 * @returns {object} the parser
 */
function stringLiteralParser() {
    return P.regexp(/"[^"]*"/);
}

/**
 * Creates a parser for choices
 * @param {object[]} parsers - the individual parsers
 * @returns {object} the parser
 */
function choiceParser(parsers) {
    return P.alt.apply(null, parsers);
}

/**
 * Creates a parser for choices of strings
 * @param {string[]} values - the individual strings
 * @returns {object} the parser
 */
function choiceStringsParser(values) {
    return choiceParser(values.map(function (x) {return P.string(x)}));
}

/**
 * Creates a parser for sequences
 * @param {object[]} parsers - the individual parsers
 * @returns {object} the parser
 */
function seqParser(parsers) {
    return P.seqMap.apply(null, parsers.concat([function () {
        var args = Array.prototype.slice.call(arguments);
        return args.filter(function(x) { return !(typeof x === 'string'); });
    }]));
}

/**
 * Creates a parser for Double
 * @param {object} variable the variable ast node
 * @returns {object} the parser
 */
function doubleParser(variable) {
    return P.regexp(/[0-9]+(.[0-9]+)?(e(\+|-)?[0-9]+)?/).map(function(x) {
        return mkVariable(variable,Number(x));
    });
}

/**
 * Creates a parser for Integer
 * @param {object} variable the variable ast node
 * @returns {object} the parser
 */
function integerParser(variable) {
    return P.regexp(/[0-9]+/).map(function(x) {
        return mkVariable(variable,Number(x));
    });
}

/**
 * Creates a parser for a String variable
 * @param {object} variable the variable ast node
 * @returns {object} the parser
 */
function stringParser(variable) {
    return stringLiteralParser().map(function(x) {
        return mkVariable(variable,x.substring(1, x.length-1));
    });
}

/**
 * Creates a parser for Enums
 * @param {object} variable the variable ast node
 * @param {string[]} enums - the enum values
 * @returns {object} the parser
 */
function enumParser(variable, enums) {
    return choiceStringsParser(enums).map(function(x) {
        return mkVariable(variable,x);
    });
}

/**
 * Creates a parser for a conditional block
 * @param {object} cond the conditional ast node
 * @returns {object} the parser
 */
function condParser(cond) {
    return P.alt(P.string(cond.whenTrue),P.string(cond.whenFalse)).map(function(x) {
        return mkCond(cond,x);
    });;
}

/**
 * Creates a parser for clause content
 * @param {object} clause the clause ast node
 * @param {object} content the parser for the content of the clause
 * @returns {object} the parser
 */
function clauseParser(clause,content) {
    return content.map(function(x) {
        return mkClause(clause,x);
    });
}

/**
 * Creates a parser for contract content
 * @param {object} contract the contract ast node
 * @param {object} content the parser for the content of the clause
 * @returns {object} the parser
 */
function contractParser(contract,content) {
    return content.map(function(x) {
        return mkContract(contract,x);
    });
}

/**
 * Creates a parser for a clause
 * @param {object} clause the clause ast node
 * @param {object} content the parser for the content of the clause
 * @returns {object} the parser
 */
function wrappedClauseParser(clause,content) {
    const clauseBefore = (() => P.seq(textParser('\n``` <clause src='),stringLiteralParser(),textParser(' clauseid='),stringLiteralParser(),textParser('>\n')));
    const clauseAfter = (() => textParser('\n```\n'));
    return content.wrap(clauseBefore(),clauseAfter()).map(function(x) {
        return mkWrappedClause(clause,x);
    });
}

module.exports.mkVariable = mkVariable;
module.exports.mkCompoundVariable = mkCompoundVariable;
module.exports.stringLiteralParser = stringLiteralParser;

module.exports.textParser = textParser;
module.exports.seqParser = seqParser;
module.exports.choiceStringsParser = choiceStringsParser;

module.exports.doubleParser = doubleParser;
module.exports.integerParser = integerParser;
module.exports.stringParser = stringParser;
module.exports.enumParser = enumParser;
module.exports.condParser = condParser;
module.exports.clauseParser = clauseParser;
module.exports.wrappedClauseParser = wrappedClauseParser;
module.exports.contractParser = contractParser;