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

import { enableOptimization } from "../../globalVars";
import { astParsingFunctions, getAstForNumber } from "../../utils/ast";

astParsingFunctions.dotProduct = function (content) {
    if (enableOptimization) {
        if (content.args[0].name === "vect" && content.args[0].args[0].name === "__number__" && content.args[0].args[1].name === "__number__" && content.args[0].args[2].name === "__number__" && content.args[1].name === "vect" && content.args[1].args[0].name === "__number__" && content.args[1].args[1].name === "__number__" && content.args[1].args[2].name === "__number__") {
            //dot product(A,B) = A.x*B.x + A.y+B.y + A.z+B.z
            return getAstForNumber(content.args[0].args[0].args[0].numValue * content.args[1].args[0].args[0].numValue + content.args[0].args[1].args[0].numValue * content.args[1].args[1].args[0].numValue + content.args[0].args[2].args[0].numValue * content.args[1].args[2].args[0].numValue);
        }
    }

    return content;
};
