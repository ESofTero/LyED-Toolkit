/* logic.js
   LyEDLogic: Parser + Evaluador + Tabla de verdad
   Símbolos soportados (input):
   - Negación: ~  ¬  !
   - Conjunción: ^  ∧  &
   - Disyunción: v  ∨  |
   - Implicación: ->  >  →
   - Paréntesis: ( )
   - Variables: letras (p, q, r, A, B...)
*/
(() => {
    if (window.LyEDLogic) return;

    const OPS = {
        NOT: "NOT",
        AND: "AND",
        OR: "OR",
        IMP: "IMP",
    };

    const normalize = (s) => {
        let x = String(s || "").trim();

        // Flecha
        x = x.replace(/→/g, "->");

        // Negación
        x = x.replace(/¬/g, "~").replace(/!/g, "~");

        // Conjunción
        x = x.replace(/∧/g, "^").replace(/&/g, "^");

        // Disyunción (AQUÍ ESTÁ EL FIX)
        x = x.replace(/∨/g, "v");
        x = x.replace(/\|\|/g, "v");
        x = x.replace(/\|/g, "v");

        // Quitar espacios extra
        x = x.replace(/\s+/g, " ").trim();

        return x;
    };

    const prettyFormula = (s) => {
        let x = normalize(s);
        x = x.replace(/->/g, "→");
        x = x.replace(/~/g, "¬");
        // ojo: "v" como OR (solo cuando es operador)
        // aquí asumimos que el usuario usa v como OR, no como variable.
        x = x.replace(/v/g, "∨");
        x = x.replace(/\^/g, "∧");
        return x;
    };

    const tokenize = (raw) => {
        const s = normalize(raw);
        if (!s) throw new Error("Fórmula vacía.");

        const tokens = [];
        let i = 0;

        const isLetter = (c) => /[A-Za-z]/.test(c);

        while (i < s.length) {
            const c = s[i];

            if (c === " ") {
                i++;
                continue;
            }

            // Implicación "->"
            if (c === "-" && s[i + 1] === ">") {
                tokens.push({ type: OPS.IMP });
                i += 2;
                continue;
            }

            // Implicación ">"
            if (c === ">") {
                tokens.push({ type: OPS.IMP });
                i += 1;
                continue;
            }

            // NOT
            if (c === "~") {
                tokens.push({ type: OPS.NOT });
                i += 1;
                continue;
            }

            // AND
            if (c === "^") {
                tokens.push({ type: OPS.AND });
                i += 1;
                continue;
            }

            // OR
            if (c === "v") {
                tokens.push({ type: OPS.OR });
                i += 1;
                continue;
            }

            // Paréntesis
            if (c === "(" || c === ")") {
                tokens.push({ type: c });
                i += 1;
                continue;
            }

            // Variable
            if (isLetter(c)) {
                tokens.push({ type: "VAR", name: c });
                i += 1;
                continue;
            }

            throw new Error(`Símbolo no válido: "${c}"`);
        }

        return tokens;
    };

    // Parser (precedencia):
    // NOT > AND > OR > IMP (derecha-asociativa)
    const parse = (raw) => {
        const tokens = tokenize(raw);
        let pos = 0;

        const peek = () => tokens[pos];
        const consume = () => tokens[pos++];

        const parsePrimary = () => {
            const t = peek();
            if (!t) throw new Error("Fórmula incompleta.");

            if (t.type === "VAR") {
                consume();
                return { type: "VAR", name: t.name };
            }

            if (t.type === "(") {
                consume();
                const expr = parseImp();
                const close = peek();
                if (!close || close.type !== ")") throw new Error("Falta ')'.");
                consume();
                return expr;
            }

            if (t.type === OPS.NOT) {
                consume();
                return { type: OPS.NOT, expr: parsePrimary() };
            }

            throw new Error("Token inesperado en la fórmula.");
        };

        const parseAnd = () => {
            let left = parsePrimary();
            while (peek() && peek().type === OPS.AND) {
                consume();
                const right = parsePrimary();
                left = { type: OPS.AND, left, right };
            }
            return left;
        };

        const parseOr = () => {
            let left = parseAnd();
            while (peek() && peek().type === OPS.OR) {
                consume();
                const right = parseAnd();
                left = { type: OPS.OR, left, right };
            }
            return left;
        };

        // Implicación derecha-asociativa
        const parseImp = () => {
            let left = parseOr();
            if (peek() && peek().type === OPS.IMP) {
                consume();
                const right = parseImp();
                return { type: OPS.IMP, left, right };
            }
            return left;
        };

        const ast = parseImp();

        if (pos !== tokens.length) {
            throw new Error("Hay símbolos sobrantes (revisa paréntesis u operadores).");
        }

        return ast;
    };

    const evalAst = (node, env) => {
        switch (node.type) {
            case "VAR":
                return Boolean(env[node.name]);
            case OPS.NOT:
                return !evalAst(node.expr, env);
            case OPS.AND:
                return evalAst(node.left, env) && evalAst(node.right, env);
            case OPS.OR:
                return evalAst(node.left, env) || evalAst(node.right, env);
            case OPS.IMP: {
                const a = evalAst(node.left, env);
                const b = evalAst(node.right, env);
                return (!a) || b;
            }
            default:
                throw new Error("AST inválido.");
        }
    };

    const collectVars = (rawList) => {
        const joined = rawList.map(normalize).join(" ");
        const found = joined.match(/[A-Za-z]/g) || [];

        const filtered = found.filter((c) => c !== "v" && c !== "V");

        const uniq = Array.from(new Set(filtered));
        uniq.sort((a, b) => a.localeCompare(b));
        return uniq;
    };

    const makeEnvs = (vars) => {
        const n = vars.length;
        const total = 1 << n;
        const envs = [];

        for (let mask = 0; mask < total; mask++) {
            const env = {};
            for (let i = 0; i < n; i++) {
                // orden clásico: F/F... primero si quieres invierte, pero esto es estable
                const bit = (mask >> (n - 1 - i)) & 1;
                env[vars[i]] = bit === 1;
            }
            envs.push(env);
        }
        return envs;
    };

    const solve = (hypothesesRaw, conclusionRaw, method) => {
        const hypsRaw = (hypothesesRaw || []).map((x) => String(x || "").trim()).filter(Boolean);
        const conclRaw = String(conclusionRaw || "").trim();

        if (hypsRaw.length < 1) throw new Error("Agrega al menos 1 hipótesis.");
        if (!conclRaw) throw new Error("Escribe la conclusión.");

        const vars = collectVars([...hypsRaw, conclRaw]);

        const hypAsts = hypsRaw.map(parse);
        const conclAst = parse(conclRaw);

        const envs = makeEnvs(vars);

        const rows = [];
        let hasCritical = false;
        let isValid = true;
        let isTaut = true;

        for (let i = 0; i < envs.length; i++) {
            const env = envs[i];

            const premVals = hypAsts.map((ast) => evalAst(ast, env));
            const conclVal = evalAst(conclAst, env);

            const allPrem = premVals.every(Boolean);
            const critical = allPrem;
            const badCritical = allPrem && !conclVal;

            const implVal = (!allPrem) || conclVal; // (premisas) → conclusión

            if (critical) hasCritical = true;
            if (badCritical) isValid = false;
            if (!implVal) isTaut = false;

            rows.push({
                env,
                premVals,
                conclVal,
                critical,
                badCritical,
                implVal,
            });
        }

        if (method === "critical") {
            return { vars, rows, hasCritical, isValid };
        }
        if (method === "taut") {
            return { vars, rows, isTaut };
        }

        throw new Error("Método inválido (usa 'critical' o 'taut').");
    };

    window.LyEDLogic = {
        normalize,
        prettyFormula,
        tokenize,
        parse,
        solve,
    };
})();