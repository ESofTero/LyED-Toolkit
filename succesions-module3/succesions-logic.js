/**
 * LyED ToolKit - Sucesiones Logic
 * Lógica pura para generar términos, sumatoria y multiplicación.
 * No toca DOM.
 */
(() => {
    "use strict";

    const ALLOWED_FUNCTIONS = [
        "sin", "cos", "tan", "sqrt", "abs", "log", "ln", "exp", "pow",
        "floor", "ceil", "round", "min", "max"
    ];

    function normalizeFormula(formula) {
        if (typeof formula !== "string" || !formula.trim()) {
            throw new Error("Escribe una fórmula explícita para aₖ.");
        }

        let expression = formula.trim();

        expression = expression
            .replace(/π/gi, "pi")
            .replace(/\^/g, "**")
            .replace(/\bln\s*\(/gi, "log(");

        expression = expression.replace(/\bpi\b/gi, "Math.PI");
        expression = expression.replace(/\be\b/g, "Math.E");

        for (const fn of ALLOWED_FUNCTIONS) {
            if (fn === "ln") continue;
            const pattern = new RegExp(`\\b${fn}\\s*\\(`, "gi");
            expression = expression.replace(pattern, `Math.${fn}(`);
        }

        if (!/^[0-9kK+\-*/().,\s*MathPIEabscosintqrtlgpwerfmnx]*$/.test(expression)) {
            throw new Error("La fórmula contiene caracteres no permitidos.");
        }

        return expression;
    }

    function buildEvaluator(formula) {
        const expression = normalizeFormula(formula);

        try {
            return new Function("k", `
                "use strict";
                const value = (${expression});
                if (!Number.isFinite(value)) {
                    throw new Error("La fórmula produjo un valor no finito en k = " + k);
                }
                return value;
            `);
        } catch (error) {
            throw new Error("La fórmula no tiene una sintaxis válida.");
        }
    }

    function validateLimits(lower, upper) {
        const m = Number(lower);
        const n = Number(upper);

        if (!Number.isInteger(m) || !Number.isInteger(n)) {
            throw new Error("Los límites m y n deben ser números enteros.");
        }

        if (m > n) {
            throw new Error("El límite inferior m no puede ser mayor que el límite superior n.");
        }

        if ((n - m + 1) > 1000) {
            throw new Error("La sucesión es demasiado larga. Usa un rango de máximo 1000 términos.");
        }

        return { m, n };
    }

    function generateSequence({ lower, upper, formula }) {
        const { m, n } = validateLimits(lower, upper);
        const evaluate = buildEvaluator(formula);

        const terms = [];
        let sum = 0;
        let product = 1;

        for (let k = m; k <= n; k++) {
            const value = evaluate(k);
            terms.push({ k, value });
            sum += value;
            product *= value;
        }

        return {
            lower: m,
            upper: n,
            formula,
            terms,
            sum,
            product
        };
    }

    window.LyEDSuccessionsLogic = {
        generateSequence
    };
})();
