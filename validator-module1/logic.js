/* logic.js
   LyEDLogic: Parser + Evaluador + Tabla de verdad
   Símbolos soportados (input):
   - Negación: ~  ¬  !
   - Conjunción: ^  ∧  &
   - Disyunción: v  ∨  |
   - Implicación: ->  >  →
   - Bicondicional: <->  <=>  ↔  ⇔
   - Paréntesis: ( )
   - Variables: letras (p, q, r, A, B...)
*/
(() => {
    "use strict";

    // Normaliza a estos tokens internos:
    // ~  ^  v  ->  <->  (  )
    const normalizeFormula = (input) => {
        let s = String(input ?? "").trim();
        s = s.replace(/\s+/g, " ");

        // Negación
        s = s.replace(/¬/g, "~");

        // Conjunción
        s = s.replace(/∧/g, "^");

        // Disyunción (soporta ∨, v/V y también |)
        // OJO: esto significa que "v" NO puede ser variable.
        s = s.replace(/∨/g, "v");
        s = s.replace(/\|/g, "v");
        s = s.replace(/\bV\b/g, "v");
        s = s.replace(/V/g, "v"); // por si la escriben pegada

        // ---------
        // ✅ Protege bicondicional antes de tocar '>'
        // ---------
        // Primero normalizamos todas las formas de bicondicional a <->,
        // luego las "congelamos" con un placeholder para que el '>' no las rompa.
        s = s.replace(/↔/g, "<->");
        s = s.replace(/⇔/g, "<->");
        s = s.replace(/<=>/g, "<->");
        // congela cualquier <-> existente (incluida la que acabamos de crear)
        s = s.replace(/<->/g, "__BIC__");

        // Implicación: →, -> y también >
        s = s.replace(/→/g, "->");
        // convertimos '>' a '->' (pero ya protegimos la bicondicional)
        s = s.replace(/>/g, "->");

        // restaura bicondicional
        s = s.replace(/__BIC__/g, "<->");

        return s;
    };

    const prettyFormula = (input) => {
        const s = normalizeFormula(input);
        return s
            .replace(/\^/g, "∧")
            .replace(/\bv\b/g, "∨")
            .replace(/~/g, "¬")
            .replace(/->/g, "→")
            .replace(/<->/g, "↔");
    };

    const extractVars = (formulas) => {
        const set = new Set();

        for (const f of formulas) {
            const s = normalizeFormula(f);
            for (let i = 0; i < s.length; i++) {
                const c = s[i];
                if (/[A-Za-z]/.test(c)) {
                    // "v" es operador OR, no variable
                    if (c === "v" || c === "V") continue;
                    set.add(c);
                }
            }
        }

        return Array.from(set).sort((a, b) => a.localeCompare(b));
    };

    const tokenize = (formula) => {
        const s = normalizeFormula(formula);
        const tokens = [];
        let i = 0;

        while (i < s.length) {
            const ch = s[i];

            if (ch === " ") {
                i++;
                continue;
            }

            // operadores largos primero
            if (s.slice(i, i + 3) === "<->") {
                tokens.push({ type: "op", value: "<->" });
                i += 3;
                continue;
            }
            if (s.slice(i, i + 2) === "->") {
                tokens.push({ type: "op", value: "->" });
                i += 2;
                continue;
            }

            // operadores simples
            if (ch === "~" || ch === "^" || ch === "v") {
                tokens.push({ type: "op", value: ch });
                i++;
                continue;
            }

            // paréntesis
            if (ch === "(" || ch === ")") {
                tokens.push({ type: "paren", value: ch });
                i++;
                continue;
            }

            // variables (una letra)
            if (/[A-Za-z]/.test(ch)) {
                if (ch === "v" || ch === "V") {
                    tokens.push({ type: "op", value: "v" });
                } else {
                    tokens.push({ type: "var", value: ch });
                }
                i++;
                continue;
            }

            throw new Error(`Carácter inválido: '${ch}'`);
        }

        return tokens;
    };

    const precedence = (op) => {
        if (op === "~") return 5;
        if (op === "^") return 4;
        if (op === "v") return 3;
        if (op === "->") return 2;
        if (op === "<->") return 1;
        return 0;
    };

    const isRightAssociative = (op) => {
        return op === "~" || op === "->";
    };

    const toRPN = (tokens) => {
        const out = [];
        const stack = [];

        for (const t of tokens) {
            if (t.type === "var") {
                out.push(t);
                continue;
            }

            if (t.type === "op") {
                const o1 = t.value;

                while (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    if (top.type !== "op") break;

                    const o2 = top.value;
                    const p1 = precedence(o1);
                    const p2 = precedence(o2);

                    const shouldPop =
                        (!isRightAssociative(o1) && p1 <= p2) ||
                        (isRightAssociative(o1) && p1 < p2);

                    if (shouldPop) out.push(stack.pop());
                    else break;
                }

                stack.push(t);
                continue;
            }

            if (t.type === "paren" && t.value === "(") {
                stack.push(t);
                continue;
            }

            if (t.type === "paren" && t.value === ")") {
                let found = false;

                while (stack.length > 0) {
                    const x = stack.pop();
                    if (x.type === "paren" && x.value === "(") {
                        found = true;
                        break;
                    }
                    out.push(x);
                }

                if (!found) throw new Error("Paréntesis desbalanceados.");
            }
        }

        while (stack.length > 0) {
            const last = stack.pop();
            if (last.type === "paren") throw new Error("Paréntesis desbalanceados.");
            out.push(last);
        }

        return out;
    };

    const evalRPN = (rpn, env) => {
        const st = [];

        for (const t of rpn) {
            if (t.type === "var") {
                if (!(t.value in env)) throw new Error(`Variable sin valor: ${t.value}`);
                st.push(Boolean(env[t.value]));
                continue;
            }

            if (t.type === "op") {
                const op = t.value;

                if (op === "~") {
                    if (st.length < 1) throw new Error("Falta operando para negación.");
                    st.push(!st.pop());
                    continue;
                }

                if (st.length < 2) throw new Error(`Faltan operandos para '${op}'.`);
                const b = st.pop();
                const a = st.pop();

                if (op === "^") st.push(a && b);
                else if (op === "v") st.push(a || b);
                else if (op === "->") st.push((!a) || b);
                else if (op === "<->") st.push((a && b) || ((!a) && (!b)));
                else throw new Error(`Operador desconocido: ${op}`);

                continue;
            }

            throw new Error("Token inesperado.");
        }

        if (st.length !== 1) throw new Error("Expresión inválida.");
        return st[0];
    };

    const compile = (formula) => {
        const tokens = tokenize(formula);
        const rpn = toRPN(tokens);
        return { raw: String(formula ?? ""), norm: normalizeFormula(formula), rpn };
    };

    const buildValuations = (vars) => {
        const n = vars.length;
        const total = 1 << n;
        const list = [];

        for (let mask = 0; mask < total; mask++) {
            const env = {};
            for (let i = 0; i < n; i++) {
                const bit = (mask >> (n - 1 - i)) & 1;
                env[vars[i]] = bit === 1;
            }
            list.push(env);
        }
        return list;
    };

    // method: "critical" | "taut"
    const solve = (hypsRaw, conclRaw, method) => {
        const all = [...hypsRaw, conclRaw];
        const vars = extractVars(all);
        if (vars.length === 0) throw new Error("No detecté variables (usa letras como p, q, r).");

        const compiledHyps = hypsRaw.map((h) => compile(h));
        const compiledConcl = compile(conclRaw);

        const valuations = buildValuations(vars);

        let hasCritical = false;
        let isValid = true;
        let isTaut = true;

        const rows = valuations.map((env) => {
            const premVals = compiledHyps.map((c) => evalRPN(c.rpn, env));
            const allPremTrue = premVals.every(Boolean);
            const conclVal = evalRPN(compiledConcl.rpn, env);

            const critical = allPremTrue;
            const badCritical = critical && !conclVal;

            if (critical) hasCritical = true;
            if (badCritical) isValid = false;

            let implVal = true;
            if (method === "taut") {
                implVal = (!allPremTrue) || conclVal;
                if (!implVal) isTaut = false;
            }

            return { env, premVals, conclVal, critical, badCritical, implVal };
        });

        return {
            vars,
            rows,
            hasCritical,
            isValid,
            isTaut,
            header: {
                hyps: hypsRaw.map(prettyFormula),
                concl: prettyFormula(conclRaw),
            },
        };
    };

    window.LyEDLogic = {
        normalizeFormula,
        prettyFormula,
        extractVars,
        solve,
    };
})();