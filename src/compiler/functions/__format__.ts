/*
 * This file is part of OverPy (https://github.com/Zezombye/overpy).
 * Copyright (c) 2019 Zezombye.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

import { astParsingFunctions, enableOptimization, bigLettersMappings, fullwidthMappings, DEBUG_MODE, enableTagsSetup } from "../../globalVars";
import { Token } from "../../compiler/tokenizer";
import { getAstForNull, Ast } from "../../utils/ast";
import { error, warn } from "../../utils/logging";
import { getUtf8Length } from "../../utils/strings";

astParsingFunctions.__format__ = function (content) {
    //Localized strings take one element more than custom strings.
    //Therefore, convert localized strings into custom strings if they are a localized string that is the same in every language.
    if (enableOptimization && content.args[0].type === "LocalizedStringLiteral" && ["", "*", "----------", "#{0}", "-> {0}", "<-> {0}", "<- {0}", "{0} ->", "{0} <->", "{0} <-", "{0} -> {1}", "{0} - {1}", "{0} != {1}", "{0} * {1}", "{0} / {1}", "{0} + {1}", "{0} <-> {1}", "{0} <- {1}", "{0} <= {1}", "{0} < {1}", "{0} == {1}", "{0} = {1}", "{0} >= {1}", "{0} > {1}", "{0} {1}", "{0} : {1} : {2}", "{0} {1} {2}", "({0})", "¡{0}!", "¿{0}?"].includes(content.args[0].name)) {
        content.args[0].type = "StringLiteral";
    }

    if (content.args[0].type === "LocalizedStringLiteral") {
        return parseLocalizedString(content.args[0], content.args.slice(1));
    } else {
        if (content.parent?.name === "createCasedProgressBarIwt") {
            //skip optimization so we can edit the string in createCasedProgressBarIwt then call this function to properly split it
            return content;
        }
        if (content.parent?.name === "strVisualLength" || content.parent?.name === "spacesForString") {
            //skip optimization (and string splitting), as the function just needs the length and doesn't do any further processing on the string
            return content;
        }
        return parseCustomString(content.args[0], content.args.slice(1));
    }
};

var caseSensitiveReplacements: Record<string, string> = {
    æ: "ӕ",
    nj: "ǌ",
    " a ": " ａ ",
    a: "ạ",
    b: "ḅ",
    c: "ƈ",
    d: "ḍ",
    e: "ẹ",
    f: "ƒ",
    //g: "ǵ",
    g: "ǥ",
    h: "һ",
    i: "і",
    j: "ј",
    k: "ḳ",
    l: "I",
    m: "ṃ",
    n: "ṇ",
    o: "ο",
    p: "ṗ",
    q: "ǫ",
    r: "ṛ",
    s: "ѕ",
    t: "ṭ",
    u: "υ",
    v: "ν",
    w: "ẉ",
    x: "ҳ",
    y: "ỵ",
    z: "ẓ",
};

//Parses a custom string.
function parseCustomString(str: Ast, formatArgs: Ast[]) {
    if (!formatArgs) {
        formatArgs = [];
    }

    var isBigLetters = str.type === "BigLettersStringLiteral";
    var isFullwidth = str.type === "FullwidthStringLiteral";
    var isPlaintext = str.type === "PlaintextStringLiteral";
    var isCaseSensitive = str.type === "CaseSensitiveStringLiteral";

    var content = str.name;
    var tokens: ({ text: string; type: "string" } | { index: number; type: "arg" } | { type: "holygrail" })[] = [];
    var numberIndex = 0;
    var args: Ast[] = [];
    var argsAreNumbered = null;
    var isConvertedToBigLetters = false;

    //Used to reorder args for easier optimization.
    //Eg "{1}{0}" is converted to "{0}{1}", with the arguments obviously switched.
    var numberMapping: Record<number, number> = {};
    var containsNonFullwidthChar = false;

    function applyStringModifiers(content: string) {
        //If big letters, try to map letters until we get one
        //We only need one letter to convert to big letters
        if (isBigLetters && !isConvertedToBigLetters) {
            for (var i = 0; i < content.length; i++) {
                if (content[i] in bigLettersMappings) {
                    content = content.substring(0, i) + bigLettersMappings[content[i]] + content.substring(i + 1);
                    isConvertedToBigLetters = true;
                    break;
                }
            }
        } else if (isFullwidth) {
            var tmpStr = "";
            for (var char of content) {
                if (char in fullwidthMappings) {
                    tmpStr += fullwidthMappings[char];
                } else {
                    containsNonFullwidthChar = true;
                    tmpStr += char;
                }
            }

            content = tmpStr;
        } else if (isCaseSensitive) {
            content = content.replace(/e([0123456789!\?\/@"\&#\^\$\*%])/g, "ѐ$1");
            content = content.replace(/n([0123456789!\?\/@"\&#\^\$\*%])/g, "ǹ$1");
            for (var key of Object.keys(caseSensitiveReplacements)) {
                content = content.replace(new RegExp(key, "g"), caseSensitiveReplacements[key]);
            }
        }

        return content;
    }

    //Tokenize string
    while (true) {
        var fieldIndex = content.search(/{\d*}/);
        var tagIndex = content.search(/<fg|<tx|<\/fg>/i);
        //console.log(str.parent?.parent?.name);
        if (str.parent?.parent?.name === "createWorkshopSetting" || str.parent?.parent?.parent?.name === "createWorkshopSetting") {
            //Don't replace tags in workshop settings
            tagIndex = -1;
        }
        if (fieldIndex >= 0 && (fieldIndex < tagIndex || tagIndex < 0)) {
            if (fieldIndex > 0) {
                tokens.push({
                    text: applyStringModifiers(content.substring(0, fieldIndex)),
                    type: "string",
                });
                content = content.substring(fieldIndex);
            }
            var number: string | number = content.substring(1, content.indexOf("}"));

            //test for {}
            if (number === "") {
                if (argsAreNumbered === true) {
                    error("Cannot switch from automatic field numbering to manual field specification");
                }
                argsAreNumbered = false;
                number = numberIndex;
            } else {
                if (argsAreNumbered === false) {
                    error("Cannot switch from automatic field numbering to manual field specification");
                }
                argsAreNumbered = true;
                number = parseInt(number);
            }
            if (!(number in numberMapping)) {
                numberMapping[number] = numberIndex;
                numberIndex++;
            }

            tokens.push({
                index: numberMapping[number],
                type: "arg",
            });
            content = content.substring(content.indexOf("}") + 1);
        } else if (tagIndex >= 0) {
            if (tagIndex > 0) {
                tokens.push({
                    text: applyStringModifiers(content.substring(0, tagIndex)),
                    type: "string",
                });
                content = content.substring(tagIndex);
            }
            if (!enableTagsSetup) {
                warn("w_tags", "A tag (<tx> or <fg>) was found in a string, but the #!setupTags directive is needed for OverPy to properly unescape them.");
                tokens.push({
                    text: applyStringModifiers("<"),
                    type: "string",
                });
            } else {
                tokens.push({
                    type: "holygrail",
                });
            }

            if (content.match(/^<tx\s*[0-9a-fA-F]+>/i)) {
                if (content.match(/^<tx\s*0*C[0-9a-fA-F]{6,}>/i) && !content.match(/^<tx\s*0*C[0-9a-fA-F]{14}>/i)) {
                    warn("w_malformatted_tx", "Malformatted <tx> tag: '" + content.substring(0, content.indexOf(">")) + ">'. <tx> tags must be in the form <txC000000000xxxxx>.");
                }
            }
            content = content.substring(1);
        } else {
            tokens.push({
                text: applyStringModifiers(content),
                type: "string",
            });
            break;
        }
    }

    //Sort args if there was (potentially) a reordering
    for (var key of Object.keys(numberMapping)) {
        if (formatArgs[+key]) {
            args[numberMapping[+key]] = formatArgs[+key];
        } else {
            if (DEBUG_MODE) console.log(numberMapping);
            error("Too few arguments in format() function: expected " + (+key + 1) + " but found " + formatArgs.length);
        }
    }

    if (isFullwidth && containsNonFullwidthChar) {
        warn("w_not_total_fullwidth", "Could not fully convert this string to fullwidth characters");
    }
    if (isBigLetters && !isConvertedToBigLetters) {
        error("Could not convert the string to big letters. The string must have one of the following chars: '" + Object.keys(bigLettersMappings).join("") + "'");
    }

    if (tokens.some((token) => token.type === "holygrail")) {
        //Add Global.holygrail at the end of the args, then convert tag tokens to arg tokens
        args.push(new Ast("__globalVar__", [new Ast("holygrail", [], [], "GlobalVariable")]));
        tokens = tokens.map((token) => {
            if (token.type === "holygrail") {
                return {
                    index: args.length - 1,
                    type: "arg",
                };
            }
            return token;
        });
    }

    //console.log(tokens);
    //console.log(args);
    //debugger;

    if (enableOptimization) {
        //Optimize string args by inlining numbers and custom strings with at most one {0}
        let argIndexesToRemove = [];
        for (let [i, arg] of args.entries()) {
            if (arg.name === "__number__" || (arg.name === "__customString__" && (arg.args[0].name.match(/\{0\}/g) || []).length <= 1 && !arg.args[0].name.includes("{1}") && !arg.args[0].name.includes("{2}"))) {
                argIndexesToRemove.push(i);
            }
        }
        //args = args.filter((_, i) => !argIndexesToRemove.includes(i))
        tokens = tokens
            .map((t) => {
                if (t.type === "arg" && argIndexesToRemove.includes(t.index)) {
                    let newText: string;
                    if (args[t.index].name === "__number__") {
                        newText = args[t.index].args[0].numValue.toFixed(2).replace(".00", "");
                    } else if (args[t.index].name === "__customString__") {
                        if (args[t.index].args[0].name.includes("{0}")) {
                            let newTexts: { text: string; type: "string" }[] = (args[t.index].args[0].name.split("{0}") as string[]).map((x) => ({ text: x, type: "string" }));
                            args[t.index] = args[t.index].args[1];
                            return [newTexts[0], t, newTexts[1]];
                        } else {
                            newText = args[t.index].args[0].name;
                        }
                    } else {
                        error("Invalid optimized string arg name '" + args[t.index].name + "', please report to Zezombye");
                    }
                    return {
                        text: newText,
                        type: "string" as "string",
                    };
                }
                return t;
            })
            .flat();
    }

    //console.log(tokens);

    //Concatenate consecutive string tokens
    tokens = tokens.reduce((acc: ({ text: string; type: "string" } | { index: number; type: "arg" } | { type: "holygrail" })[], token) => {
        let last = acc[acc.length - 1];
        if (last && last.type === "string" && token.type === "string") {
            last.text += token.text;
        } else {
            acc.push(token);
        }
        return acc;
    }, []);

    //texture tag autocorrect
    if (enableTagsSetup) {
        for (let token of tokens) {
            let match;
            if (token.type === "string" && (match = token.text.match(/^tx\s*0*([0-9a-fA-F]{1,6})>/i))) {
                //console.log(match[1]);
                token.text = "txC00000000000000".substring(0, "txC00000000000000".length - match[1].length) + match[1] + token.text.substring(token.text.indexOf(">"));
            }
        }
    }

    return parseStringTokens(tokens as ({ text: string; type: "string" } | { index: number; type: "arg" })[], args);
}

function parseStringTokens(tokens: ({ text: string; type: "string" } | { index: number; type: "arg" })[], args: Ast[]) {
    var result = "";
    var resultArgs: Ast[] = [];
    var numbers: number[] = [];
    var numbersEncountered: number[] = [];
    var mappings: Record<number, number> = {};
    var stringLength = 0;
    var currentNbIndex = 0;

    //iterate through tokens and figure out the total number of unique numbers
    for (var token of tokens) {
        if (token.type === "string") {
            continue;
        } else {
            if (!numbers.includes(token.index)) {
                numbers.push(token.index);
            }
        }
    }

    //Add tokens
    //For now, no optimization: just split if more than 3 unique numbers

    //Compilation optimization: do not do this whole loop if the string is "simple" (aka one token that doesn't need to be split)
    if (tokens.length === 1 && tokens[0].type === "string" && getUtf8Length(tokens[0].text) <= 128) {
        result = tokens[0].text;
    } else {
        for (var i = 0; i < tokens.length; i++) {
            //length check
            let token = tokens[i];
            if ((token.type === "string" && stringLength + getUtf8Length(token.text) > 128 - (i === tokens.length - 1 ? 0 : "{0}".length)) || (token.type === "arg" && stringLength + "{0}".length > 128 - (i === tokens.length - 1 ? 0 : "{0}".length))) {
                var splitString = false;
                if (token.type === "string" && (stringLength + getUtf8Length(token.text) > 128 || tokens.length > i)) {
                    var tokenText = [...token.text];
                    var tokenSliceLength = 0;
                    var sliceIndex = 0;
                    for (var j = 0; stringLength + tokenSliceLength < 128 - "{0}".length * 2; j++) {
                        tokenSliceLength += getUtf8Length(tokenText[j] + "");
                        sliceIndex++;
                    }

                    result += tokenText.slice(0, sliceIndex).join("");

                    token.text = tokenText.slice(sliceIndex).join("");
                    splitString = true;
                } else if (token.type === "arg" && tokens.length > i) {
                    splitString = true;
                }

                if (splitString) {
                    result += "{" + currentNbIndex + "}";
                    if (currentNbIndex > 2) {
                        error("Custom string parser returned '{" + currentNbIndex + "}', please report to Zezombye");
                    }
                    resultArgs.push(parseStringTokens(tokens.slice(i, tokens.length), args));
                    break;
                }
            }

            if (token.type === "string") {
                result += token.text;
                stringLength += getUtf8Length(token.text);
            } else {
                // If we have encountered more than 2 numbers and we've either:
                //   - got more than 3 numbers incoming, or
                //   - the string would be too long with additional tokens incoming
                // then we need to split the format string and continue extending
                // the string in a nested custom string
                if (numbersEncountered.length >= 2 && (numbers.length > 3 || (i < tokens.length - 1 && stringLength + (tokens[i + 1].type === "string" ? getUtf8Length((tokens[i + 1] as { text: string }).text) + "{0}".length : "{0}".length) > 128))) {
                    //split
                    result += "{2}";
                    resultArgs.push(parseStringTokens(tokens.slice(i, tokens.length), args));
                    break;
                } else {
                    if (!(token.index in mappings)) {
                        mappings[token.index] = numbersEncountered.length;
                    }
                    if (!numbersEncountered.includes(token.index)) {
                        numbersEncountered.push(token.index);
                        resultArgs.push(args[token.index]);
                    }
                    result += "{" + mappings[token.index] + "}";
                    if (mappings[token.index] > 2) {
                        error("Custom string parser returned '{" + mappings[token.index] + "}', please report to Zezombye");
                    }
                    if (mappings[token.index] === currentNbIndex) {
                        currentNbIndex++;
                    }
                    stringLength += "{0}".length;
                }
            }
        }
    }

    while (resultArgs.length < 3) {
        resultArgs.push(getAstForNull());
    }

    if (resultArgs.length !== 3) {
        error("Custom string parser broke (string args length is " + resultArgs.length + "), please report to Zezombye");
    }

    return new Ast("__customString__", [new Ast(result, [], [], "CustomStringLiteral")].concat(resultArgs));
}

//Parses localized string
function parseLocalizedString(content: Ast, formatArgs: Ast[]) {
    if (formatArgs.length > 3) {
        error("A localized string cannot have more than 3 arguments in the 'format' function");
    }
    while (formatArgs.length < 3) {
        formatArgs.push(getAstForNull());
    }

    return new Ast("__localizedString__", [content, ...formatArgs]);
}
