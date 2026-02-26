/**
 * LyED ToolKit (Logic)
 * Este archivo contiene TODA la lógica de proposiciones:
 * - Normalización de símbolos (¬, ~, ^, v, ->, <->, etc.)
 * - Validaciones (paréntesis, tokens, caracteres inválidos)
 * - Tokenización y parsing a RPN (Shunting-yard)
 * - Evaluación de fórmulas para una valuación (p/q/r = V/F)
 * - Generación de tablas de verdad
 *
 * Importante:
 * - NO toca DOM.
 * - validator.js se encarga de la interfaz y llama a estas funciones.
 */

(() => {
    const SYMBOLS = {
        NOT: ["¬", "~", "!"],
        AND: ["∧", "^", "&"],
        OR: ["∨", "v", "|"],
        IMP: ["→", "->", ">"],
        IFF: ["↔", "<->", "<=>"],
    };

    const PRECEDENCE = {
        "¬": 4,
        "∧": 3,
        "∨": 2,
        "→": 1,
        "↔": 0,
    };

    const RIGHT_ASSOC = new Set(["¬", "→", "↔"]);

    const isLetter = (ch) => /^[A-Za-z]$/.test(ch);

    const normalizeFormula = (raw) => {
        if (typeof raw !== "string") return "";

        let s = raw;

        // Normaliza operadores largos primero para evitar colisiones (ej. "<->" vs "->")
        s = s.replaceAll("<=>", "↔");
        s = s.replaceAll("<->", "↔");
        s = s.replaceAll("->", "→");

        // Normaliza símbolos alternos
        SYMBOLS.NOT.forEach((op) => (s = s.replaceAll(op, "¬")));
        SYMBOLS.AND.forEach((op) => (s = s.replaceAll(op, "∧")));
        SYMBOLS.OR.forEach((op) => (s = s.replaceAll(op, "∨")));
        SYMBOLS.IMP.forEach((op) => (s = s.replaceAll(op, "→")));
        SYMBOLS.IFF.forEach((op) => (s = s.replaceAll(op, "↔")));

        // Limpieza ligera: espacios
        s = s.replace(/\s+/g, "");
        return s;
    };

    const prettyFormula = (raw) => {
        if (typeof raw !== "string") return "";

        let s = raw;

        // Al mostrar, respeta primero la bicondicional y luego la implicación
        s = s.replaceAll("<=>", "↔");
        s = s.replaceAll("<->", "↔");
        s = s.replaceAll("->", "→");

        s = s.replaceAll("!", "¬");
        s = s.replaceAll("~", "¬");
        s = s.replaceAll("^", "∧");
        s = s.replaceAll("&", "∧");
        s = s.replaceAll("v", "∨");
        s = s.replaceAll("|", "∨");
        s = s.replaceAll(">", "→");

        return s.replace(/\s+/g, "");
    };

    const getVariables = (formulas) => {
        const vars = new Set();
        formulas.forEach((f) => {
            for (const ch of f) if (isLetter(ch)) vars.add(ch);
        });
        return Array.from(vars).sort();
    };

    const checkBalancedParentheses = (s) => {
        let depth = 0;
        for (const ch of s) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
            if (depth < 0) return false;
        }
        return depth === 0;
    };

    const validateCharacters = (s) => {
        // Permitidos: letras, paréntesis y operadores ya normalizados
        for (const ch of s) {
            if (
                isLetter(ch) ||
                ch === "(" ||
                ch === ")" ||
                ch === "¬" ||
                ch === "∧" ||
                ch === "∨" ||
                ch === "→" ||
                ch === "↔"
            ) {
                continue;
            }
            return { ok: false, ch };
        }
        return { ok: true };
    };

    const tokenize = (s) => {
        const tokens = [];
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (isLetter(ch)) tokens.push({ type: "var", value: ch });
            else if (ch === "(" || ch === ")") tokens.push({ type: "paren", value: ch });
            else tokens.push({ type: "op", value: ch });
        }
        return tokens;
    };

    const toRPN = (tokens) => {
        // Shunting-yard: convierte infix a RPN (postfija)
        const out = [];
        const stack = [];

        for (const t of tokens) {
            if (t.type === "var") out.push(t);
            else if (t.type === "paren" && t.value === "(") stack.push(t);
            else if (t.type === "paren" && t.value === ")") {
                while (stack.length && stack[stack.length - 1].value !== "(") out.push(stack.pop());
                if (!stack.length) throw new Error("Paréntesis desbalanceados");
                stack.pop();
            } else if (t.type === "op") {
                const o1 = t.value;
                while (stack.length) {
                    const top = stack[stack.length - 1];
                    if (top.type !== "op") break;

                    const o2 = top.value;
                    const p1 = PRECEDENCE[o1];
                    const p2 = PRECEDENCE[o2];

                    const shouldPop =
                        (RIGHT_ASSOC.has(o1) && p1 < p2) ||
                        (!RIGHT_ASSOC.has(o1) && p1 <= p2);

                    if (!shouldPop) break;
                    out.push(stack.pop());
                }
                stack.push(t);
            }
        }

        while (stack.length) {
            const t = stack.pop();
            if (t.type === "paren") throw new Error("Paréntesis desbalanceados");
            out.push(t);
        }

        return out;
    };

    const evalRPN = (rpn, valuation) => {
        // Evalúa una fórmula ya en RPN usando una valuación {p:true, q:false, ...}
        const st = [];

        for (const t of rpn) {
            if (t.type === "var") {
                if (!(t.value in valuation)) throw new Error(`Variable sin valor: ${t.value}`);
                st.push(Boolean(valuation[t.value]));
                continue;
            }

            const op = t.value;

            if (op === "¬") {
                if (st.length < 1) throw new Error("Falta operando para negación");
                st.push(!st.pop());
                continue;
            }

            if (st.length < 2) throw new Error("Faltan operandos para operador binario");
            const b = st.pop();
            const a = st.pop();

            if (op === "∧") st.push(a && b);
            else if (op === "∨") st.push(a || b);
            else if (op === "→") st.push((!a) || b);
            else if (op === "↔") st.push(a === b);
            else throw new Error(`Operador desconocido: ${op}`);
        }

        if (st.length !== 1) throw new Error("Expresión inválida");
        return st[0];
    };

    const buildTruthTable = (hypothesesRaw, conclusionRaw) => {
        const hypothesesPretty = hypothesesRaw.map(prettyFormula);
        const conclusionPretty = prettyFormula(conclusionRaw);

        const hypotheses = hypothesesRaw.map(normalizeFormula);
        const conclusion = normalizeFormula(conclusionRaw);

        const allFormulas = [...hypotheses, conclusion];

        // Validaciones “rápidas” antes del parseo
        for (const f of allFormulas) {
            if (!f) throw new Error("Fórmula vacía");
            if (!checkBalancedParentheses(f)) throw new Error("Paréntesis desbalanceados");
            const v = validateCharacters(f);
            if (!v.ok) throw new Error(`Carácter inválido: '${v.ch}'`);
        }

        const variables = getVariables(allFormulas);
        const rpnHyps = hypotheses.map((f) => toRPN(tokenize(f)));
        const rpnConcl = toRPN(tokenize(conclusion));

        const rowsCount = 2 ** variables.length;
        const rows = [];

        for (let mask = 0; mask < rowsCount; mask++) {
            const valuation = {};
            for (let i = 0; i < variables.length; i++) {
                const bit = (mask >> (variables.length - 1 - i)) & 1;
                valuation[variables[i]] = bit === 1;
            }

            const hypVals = rpnHyps.map((r) => evalRPN(r, valuation));
            const conclVal = evalRPN(rpnConcl, valuation);

            rows.push({
                valuation,
                hypotheses: hypVals,
                conclusion: conclVal,
            });
        }

        return {
            variables,
            hypothesesPretty,
            conclusionPretty,
            rows,
        };
    };

    const validateByCriticalRow = (table) => {
        // Renglón crítico: filas donde TODAS las hipótesis son verdaderas
        const critical = [];
        let hasCritical = false;
        let valid = true;

        table.rows.forEach((row, idx) => {
            const allPremisesTrue = row.hypotheses.every(Boolean);
            if (allPremisesTrue) {
                hasCritical = true;
                critical.push(idx);
                if (!row.conclusion) valid = false;
            }
        });

        if (!hasCritical) {
            return { kind: "vacuous", criticalRows: [] };
        }

        return { kind: valid ? "valid" : "invalid", criticalRows: critical };
    };

    const validateByTautology = (table) => {
        // Tautología: (H1 ∧ ... ∧ Hn) → C es verdadera en todas las filas
        let isTautology = true;

        for (const row of table.rows) {
            const premises = row.hypotheses.every(Boolean);
            const implication = (!premises) || row.conclusion;
            if (!implication) {
                isTautology = false;
                break;
            }
        }

        return { kind: isTautology ? "valid" : "invalid" };
    };

    // API pública para el validador (UI)
    window.LYED_LOGIC = {
        normalizeFormula,
        prettyFormula,
        buildTruthTable,
        validateByCriticalRow,
        validateByTautology,
    };
})();