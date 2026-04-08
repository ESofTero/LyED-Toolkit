/**
 * LyED ToolKit - Sets Logic
 * Lógica pura para operaciones con conjuntos.
 *
 * - NO toca DOM
 * - Trabaja con etiquetas tipo A, B, C, D...
 * - Soporta:
 *   ∪  unión
 *   ∩  intersección
 *   -  diferencia
 *   △  diferencia simétrica
 *   ( ) paréntesis
 */

(() => {
    "use strict";

    const OPERATORS = {
        "∪": { precedence: 1, associativity: "left" },
        "△": { precedence: 1, associativity: "left" },
        "∩": { precedence: 2, associativity: "left" },
        "-": { precedence: 2, associativity: "left" }
    };

    function isSetLabel(token) {
        return /^[A-TV-Z]$/.test(token);
    }

    function normalizeExpression(input) {
        if (typeof input !== "string") {
            throw new Error("La expresión debe ser texto.");
        }

        return input
            .trim()
            .replace(/\s+/g, "")
            .replace(/\^/g, "∩");
    }

    function tokenize(expression) {
        const normalized = normalizeExpression(expression);

        if (!normalized) {
            throw new Error("La expresión está vacía.");
        }

        const tokens = [];
        let index = 0;

        while (index < normalized.length) {
            const char = normalized[index];

            if (isSetLabel(char)) {
                tokens.push(char);
                index += 1;
                continue;
            }

            if (["∪", "∩", "-", "△", "(", ")"].includes(char)) {
                tokens.push(char);
                index += 1;
                continue;
            }

            throw new Error(`Símbolo inválido: "${char}"`);
        }

        return tokens;
    }

    function validateParentheses(tokens) {
        let balance = 0;

        for (const token of tokens) {
            if (token === "(") balance += 1;
            if (token === ")") balance -= 1;

            if (balance < 0) {
                throw new Error("Paréntesis desbalanceados.");
            }
        }

        if (balance !== 0) {
            throw new Error("Faltan paréntesis por cerrar.");
        }
    }

    function validateTokenSequence(tokens) {
        const isOperand = (token) => isSetLabel(token) || token === "(";
        const isClosable = (token) => isSetLabel(token) || token === ")";

        for (let i = 0; i < tokens.length; i += 1) {
            const current = tokens[i];
            const next = tokens[i + 1];

            if (!next) break;

            if (isSetLabel(current) && isSetLabel(next)) {
                throw new Error("Falta un operador entre conjuntos.");
            }

            if (isSetLabel(current) && next === "(") {
                throw new Error("Falta un operador antes del paréntesis.");
            }

            if (current === ")" && isOperand(next)) {
                throw new Error("Falta un operador después del paréntesis.");
            }

            if (current in OPERATORS && (next in OPERATORS || next === ")")) {
                throw new Error("La expresión está incompleta.");
            }

            if (current === "(" && (next in OPERATORS || next === ")")) {
                throw new Error("La expresión dentro del paréntesis es inválida.");
            }
        }

        const first = tokens[0];
        const last = tokens[tokens.length - 1];

        if (!isOperand(first)) {
            throw new Error("La expresión debe iniciar con un conjunto o paréntesis.");
        }

        if (!isClosable(last)) {
            throw new Error("La expresión está incompleta.");
        }
    }

    function toRPN(tokens) {
        validateParentheses(tokens);
        validateTokenSequence(tokens);

        const output = [];
        const stack = [];

        for (const token of tokens) {
            if (isSetLabel(token)) {
                output.push(token);
                continue;
            }

            if (token in OPERATORS) {
                while (stack.length && stack[stack.length - 1] in OPERATORS) {
                    const top = stack[stack.length - 1];
                    const current = OPERATORS[token];
                    const previous = OPERATORS[top];

                    const shouldPop =
                        (current.associativity === "left" && current.precedence <= previous.precedence) ||
                        (current.associativity === "right" && current.precedence < previous.precedence);

                    if (!shouldPop) break;
                    output.push(stack.pop());
                }

                stack.push(token);
                continue;
            }

            if (token === "(") {
                stack.push(token);
                continue;
            }

            if (token === ")") {
                let foundOpen = false;

                while (stack.length) {
                    const top = stack.pop();

                    if (top === "(") {
                        foundOpen = true;
                        break;
                    }

                    output.push(top);
                }

                if (!foundOpen) {
                    throw new Error("Paréntesis desbalanceados.");
                }
            }
        }

        while (stack.length) {
            const top = stack.pop();

            if (top === "(" || top === ")") {
                throw new Error("Paréntesis desbalanceados.");
            }

            output.push(top);
        }

        return output;
    }

    function union(setA, setB) {
        return new Set([...setA, ...setB]);
    }

    function intersection(setA, setB) {
        return new Set([...setA].filter((item) => setB.has(item)));
    }

    function difference(setA, setB) {
        return new Set([...setA].filter((item) => !setB.has(item)));
    }

    function symmetricDifference(setA, setB) {
        return union(difference(setA, setB), difference(setB, setA));
    }

    function applyOperator(operator, setA, setB) {
        if (!(setA instanceof Set) || !(setB instanceof Set)) {
            throw new Error("Operación inválida entre elementos no compatibles.");
        }

        switch (operator) {
            case "∪":
                return union(setA, setB);
            case "∩":
                return intersection(setA, setB);
            case "-":
                return difference(setA, setB);
            case "△":
                return symmetricDifference(setA, setB);
            default:
                throw new Error(`Operador no soportado: ${operator}`);
        }
    }

    function evaluateRPN(rpnTokens, setMap) {
        const stack = [];

        for (const token of rpnTokens) {
            if (isSetLabel(token)) {
                const targetSet = setMap[token];

                if (!(targetSet instanceof Set)) {
                    throw new Error(`El conjunto ${token} no existe.`);
                }

                stack.push(new Set(targetSet));
                continue;
            }

            if (token in OPERATORS) {
                const right = stack.pop();
                const left = stack.pop();

                if (!left || !right) {
                    throw new Error("La expresión está incompleta.");
                }

                stack.push(applyOperator(token, left, right));
            }
        }

        if (stack.length !== 1) {
            throw new Error("La expresión no pudo resolverse correctamente.");
        }

        return stack[0];
    }

    function evaluate(expression, setMap) {
        if (!setMap || typeof setMap !== "object") {
            throw new Error("No se recibieron conjuntos para evaluar.");
        }

        const tokens = tokenize(expression);
        const rpn = toRPN(tokens);
        return evaluateRPN(rpn, setMap);
    }

    window.LyEDSetLogic = {
        evaluate
    };
})();