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

import { Ast, astContainsRandom, astParsingFunctions } from "../../utils/ast";

astParsingFunctions[".remove"] = function (content) {
    //That way we don't duplicate the code for 2d/3d array accesses
    if (!astContainsRandom(content.args[0])) {
        return new Ast("__assignTo__", [content.args[0], new Ast(".exclude", [content.args[0], content.args[1]])]);
    }
    return new Ast("__modifyVar__", [content.args[0], new Ast("__removeFromArrayByValue__", [], [], "__Operation__"), content.args[1]]);
};
