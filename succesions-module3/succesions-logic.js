/**
 * LyED ToolKit - Sucesiones Logic
 * Lógica pura para generar términos, sumatoria y multiplicación.
 * No toca DOM.
 */

(() => {
    "use strict";

    const ALLOWED_FUNCTIONS = [
        "sin", "cos", "tan", "sqrt", "abs", "log", "exp",
        "floor", "ceil", "round", "min", "max"
    ];

    function normalizeFormula(formula) {
        if (typeof formula !== "string" || !formula.trim()) {
            throw new Error("Escribe una fórmula para aₖ.");
        }

        let expression = formula.trim();

        expression = expression
            .replace(/π/gi, "pi")
            .replace(/\^/g, "**")
            .replace(/\bln\s*\(/gi, "log("); // ln = log natural

        expression = expression.replace(/\bpi\b/gi, "Math.PI");
        expression = expression.replace(/\be\b/g, "Math.E");

        for (const fn of ALLOWED_FUNCTIONS) {
            const pattern = new RegExp(`\\b${fn}\\s*\\(`, "gi");
            expression = expression.replace(pattern, `Math.${fn}(`);
        }

        if (!/^[0-9kK+\-*/().,\sA-Za-z]*$/.test(expression)) {
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
                    throw new Error("Valor inválido en k = " + k);
                }
                return value;
            `);
        } catch {
            throw new Error("La fórmula no tiene una sintaxis válida.");
        }
    }

    function validateLimits(lower, upper) {
        const m = Number(lower);
        const n = Number(upper);

        if (!Number.isInteger(m) || !Number.isInteger(n)) {
            throw new Error("m y n deben ser números enteros.");
        }

        if (m > n) {
            throw new Error("m no puede ser mayor que n.");
        }

        if ((n - m + 1) > 1000) {
            throw new Error("Máximo 1000 términos permitidos.");
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

            terms.push({
                k,
                value: Number(value.toFixed(4))
            });

            sum += value;
            product *= value;
        }

        return {
            lower: m,
            upper: n,
            formula,
            terms,
            sum: Number(sum.toFixed(4)),
            product: Number(product.toFixed(4))
        };
    }

    function sumaRecursiva(lista, i = 0) {
        if (i >= lista.length) return 0;
        return lista[i].value + sumaRecursiva(lista, i + 1);
    }

    function productoRecursivo(lista, i = 0) {
        if (i >= lista.length) return 1;
        return lista[i].value * productoRecursivo(lista, i + 1);
    }

    function generarEjemplo() {
        const ejemplos = [
            { formula: "1/k", lower: 1, upper: 5 },
            { formula: "k", lower: 1, upper: 6 },
            { formula: "k*2", lower: 1, upper: 5 },
            { formula: "k^2", lower: 1, upper: 4 },
            { formula: "2*k+3", lower: 1, upper: 5 },
            { formula: "sqrt(k)", lower: 1, upper: 5 },
            { formula: "sin(k)", lower: 1, upper: 5 }
        ];

        return ejemplos[Math.floor(Math.random() * ejemplos.length)];
    }


    window.LyEDSuccessionsLogic = {
        generateSequence,
        sumaRecursiva,
        productoRecursivo,
        generarEjemplo
    };
})();
