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
import { DEBUG_MODE, encounteredWarnings, fileStack, globallySuppressedWarningTypes, hiddenWarnings, setFileStack, suppressedWarningTypes } from "../globalVars";
import { Type } from "../types";
import { Ast } from "./ast";
import { tabLevel } from "./other";
import { escapeString } from "./strings";
import { dispTokens } from "./tokens";
import { isTypeSuitable } from "./types";

//Logging stuff
export function error(str: string, token?: any): never {
    if (token !== undefined && token.fileStack !== undefined) {
        setFileStack(token.fileStack);
    }

    //var error = "ERROR: ";
    var err = "";
    err += str;
    if (token !== undefined) {
        err += "'" + dispTokens(token) + "'";
    }
    if (fileStack) {
        if (fileStack.length !== 0) {
            fileStack.reverse();
            for (var file of fileStack) {
                if ("rule" in file) {
                    err += "\n------------------------------------------------------------------------------------\nat rule #" + file.ruleNb + " ('" + file.rule + "')" + ("actionNb" in file ? ", action #" + file.actionNb : "conditionNb" in file ? ", condition #" + file.conditionNb : "");
                } else {
                    err += "\n\t| line " + file.currentLineNb + ", col " + file.currentColNb + ", at " + file.name;
                }
            }
        }
    } else {
        err += "\n\t| <no filestack>";
    }

    throw new Error(err);
}

export function warn(warnType: string, message: string) {
    let warning = message + " (" + warnType + ")";
    if (fileStack) {
        if (fileStack.length !== 0) {
            fileStack.reverse();
            for (var file of fileStack) {
                if ("rule" in file) {
                    // @ts-ignore - I don't know where the properties this object has come from, and I don't care to find them
                    warning += "\n------------------------------------------------------------------------------------\nat rule #" + file.ruleNb + " ('" + file.rule + "')" + (file.actionNb ? ", action #" + file.actionNb : file.conditionNb ? ", condition #" + file.conditionNb : "");
                } else {
                    warning += "\n\t| line " + file.currentLineNb + ", col " + file.currentColNb + ", at " + file.name;
                }
            }
        }
    } else {
        warning += "\n\t| <no filestack>";
    }

    if (suppressedWarningTypes.includes(warnType) || globallySuppressedWarningTypes.includes(warnType) || warnType === "w_type_check") {
        hiddenWarnings.push(warning);
        return;
    }

    console.warn(warning);
    encounteredWarnings.push(warning);
}

export const debug = (data: string) => {
    if (DEBUG_MODE) {
        console.debug("DEBUG: " + data);
    }
};

export function getTypeCheckFailedMessage(content: Ast, argNb: number, expectedType: Type, received: Ast) {
    var funcDisplayName = functionNameToString(content);
    var argKind = funcDisplayName.startsWith("operator ") ? "operand" : "argument";

    var receivedFuncName = functionNameToString(received);

    return `Expected type '${typeToString(expectedType)}' for the ${nthOfNumber(argNb + 1)} ${argKind} of ${funcDisplayName}, but got ${receivedFuncName} of type '${typeToString(received.type.toString())}'`;
}

export function functionNameToString(content: Ast) {
    if (typeof content === "string") {
        error("Expected an object for internal function 'functionNameToString' but got '" + content + "'");
    }

    var funcToOperatorMapping = {
        __add__: "'+' or '+='",
        __and__: "'and'",
        __arrayContains__: "'in'",
        __assignTo__: "'='",
        __divide__: "'/' or '/='",
        __equals__: "'=='",
        __inequals__: "'!='",
        __greaterThan__: "'>'",
        __greaterThanOrEquals__: "'>='",
        __lessThan__: "'<'",
        __lessThanOrEquals__: "'<='",
        __modulo__: "'%' or '%='",
        __multiply__: "'*' or '*='",
        __not__: "'not'",
        __or__: "'or'",
        __raiseToPower__: "'**' or '**='",
        __subtract__: "'-' or '-='",
        //todo
    };

    var funcToDisplayMapping = {
        __chaseAtRate__: "chase",
        __chaseOverTime__: "chase",
        __raycast__: "raycast",
        __all__: "all",
        __any__: "any",
        __arraySlice__: ".slice",
        __concat__: ".concat",
        __indexOfArrayValue__: ".index",
        __lastOf__: ".last",
        __removeFromArray__: ".exclude",
        __sortedArray__: ".sorted",
        __strCharAt__: ".charAt",
        __strIndex__: ".strIndex",
        __strReplace__: ".replace",
        __strSplit__: ".split",
        __substring__: ".substring",
        __workshopSettingCombo__: "createWorkshopSetting",
        __workshopSettingHero__: "createWorkshopSetting",
        __workshopSettingInteger__: "createWorkshopSetting",
        __workshopSettingReal__: "createWorkshopSetting",
        __workshopSettingToggle__: "createWorkshopSetting",
        __xComponentOf__: ".x",
        __yComponentOf__: ".y",
        __zComponentOf__: ".z",
        //todo
    };

    let funcDisplayName: string;

    if (content.name in funcToOperatorMapping) {
        funcDisplayName = "operator " + funcToOperatorMapping[content.name as keyof typeof funcToOperatorMapping];
    } else if (content.name in funcToDisplayMapping) {
        funcDisplayName = "function '" + funcToDisplayMapping[content.name as keyof typeof funcToDisplayMapping] + "'";
    } else if (isTypeSuitable("StringLiteral", content.type)) {
        funcDisplayName = "string " + escapeString(content.name, false);
    } else if (content.name === "__number__") {
        funcDisplayName = "number '" + content.args[0].numValue + "'";
    } else if (content.name === "__globalVar__") {
        funcDisplayName = "global variable '" + content.args[0].name + "'";
    } else if (content.name === "__playerVar__") {
        funcDisplayName = "player variable '" + content.args[1].name + "'";
    } else if (["__button__", "__color__", "__hero__", "__map__", "__gamemode__", "__team__"].includes(content.name)) {
        funcDisplayName = "enum '" + content.type.toString() + "'";
    } else {
        funcDisplayName = "function '" + content.name.replace("_&", ".") + "'";
    }

    return funcDisplayName;
}

export function typeToString(type: Type): Type {
    if (typeof type === "string") {
        return type;
    } else if (type instanceof Array) {
        return type.map((x: string) => typeToString(x)).join(" | ");
    } else if (typeof type === "object") {
        if ("Array" in type) {
            let value = type["Array"];
            if (value instanceof Array) {
                error("Can't pass an array to typeToString()");
            }
            return typeToString(value) + "[]";
        } else if ("Vector" in type || "Direction" in type || "Position" in type || "Velocity" in type) {
            if (!(type[Object.keys(type)[0]] instanceof Array)) {
                error("Unexpected singular type when stringifying a vector type");
            }
            return Object.keys(type)[0] + "[" + (type[Object.keys(type)[0]] as Type[]).map((x) => typeToString(x)).join(", ") + "]";
        } else {
            error("Could not display type '" + JSON.stringify(type) + "'");
        }
    } else {
        error("Could not display type '" + type + "'");
    }
}

export function nthOfNumber(nb: number) {
    if (nb === 1) {
        return "1st";
    } else if (nb === 2) {
        return "2nd";
    } else if (nb === 3) {
        return "3rd";
    } else {
        return nb + "th";
    }
}

export function astToString(ast: Ast, nbTabs = 0) {
    var result = "";
    if (ast === undefined) {
        return "__undefined__";
    }
    result += ast.name;
    if (ast.args === undefined) {
        result += "(__undefined__)";
    } else if (ast.args.length > 0) {
        result += "(" + ast.args.map((x) => astToString(x)).join(", ") + ")";
    }
    if (ast.children === undefined) {
        result += ":__undefined__";
    } else if (ast.children.length > 0) {
        result += ":\n";
        for (var child of ast.children) {
            result += tabLevel(nbTabs + 1) + astToString(child, nbTabs + 1) + "\n";
        }
    }
    return result;
}
