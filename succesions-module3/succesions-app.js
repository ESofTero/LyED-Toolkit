document.addEventListener("DOMContentLoaded", () => {
    const lowerLimit = document.getElementById("lowerLimit");
    const upperLimit = document.getElementById("upperLimit");
    const formulaInput = document.getElementById("formulaInput");
    const generateBtn = document.getElementById("generateBtn");
    const exampleBtn = document.getElementById("exampleBtn");

    const termsCard = document.getElementById("termsCard");
    const resultsCard = document.getElementById("resultsCard");
    const errorCard = document.getElementById("errorCard");

    const termsList = document.getElementById("termsList");
    const termsCount = document.getElementById("termsCount");
    const sumValue = document.getElementById("sumValue");
    const productValue = document.getElementById("productValue");
    const sumNotation = document.getElementById("sumNotation");
    const productNotation = document.getElementById("productNotation");
    const errorText = document.getElementById("errorText");

    let generatedState = false;

    if (
        !lowerLimit || !upperLimit || !formulaInput || !generateBtn || !exampleBtn ||
        !termsCard || !resultsCard || !errorCard || !termsList || !termsCount ||
        !sumValue || !productValue || !sumNotation || !productNotation || !errorText
    ) {
        console.error("Faltan elementos necesarios en el DOM para succesions-app.js");
        return;
    }

    function formatNumber(value) {
        const absolute = Math.abs(value);

        if (value === 0) return "0";
        if (absolute >= 1e7 || absolute < 1e-6) return value.toExponential(6);

        return Number(value.toFixed(12)).toString();
    }

    function showCard(card) {
        card.classList.remove("hidden");
        card.classList.add("reveal-card");

        requestAnimationFrame(() => {
            card.classList.add("is-visible");
        });
    }

    function hideCard(card) {
        card.classList.remove("is-visible");
        card.classList.add("hidden");
    }

    function clearOutput() {
        termsList.innerHTML = "";
        hideCard(termsCard);
        hideCard(resultsCard);
        hideCard(errorCard);
    }

    function resetForm() {
        lowerLimit.value = "";
        upperLimit.value = "";
        formulaInput.value = "";

        clearOutput();

        generatedState = false;
        generateBtn.textContent = "Generar sucesión";
    }

    function showError(message) {
        errorText.textContent = message;
        hideCard(termsCard);
        hideCard(resultsCard);
        showCard(errorCard);
    }

    function buildTermCalculation(formula, k) {
        return String(formula).replace(/\bk\b/gi, String(k));
    }

    function renderTerms(terms, formula) {
        termsList.innerHTML = "";

        terms.forEach(term => {
            const item = document.createElement("div");
            item.className = "term-item";
            item.innerHTML = `
                                <span class="term-label">a<sub>${term.k}</sub></span>
                                <span class="term-equals">=</span>
                                <span class="term-expression">(${buildTermCalculation(formula, term.k)})</span>
                                <span class="term-result">${formatNumber(term.value)}</span>
                            `;
            termsList.appendChild(item);
        });

        termsCount.textContent = `${terms.length} término${terms.length === 1 ? "" : "s"}`;
        showCard(termsCard);
    }

    function renderResults(sequence) {
        const { lower, upper, sum, product } = sequence;

        sumValue.textContent = formatNumber(sum);
        productValue.textContent = formatNumber(product);

        sumNotation.innerHTML = `Σ a<sub>k</sub>, k = ${lower}...${upper}`;
        productNotation.innerHTML = `Π a<sub>k</sub>, k = ${lower}...${upper}`;

        showCard(resultsCard);
    }

    function generate() {
        clearOutput();

        try {
            const sequence = window.LyEDSuccessionsLogic.generateSequence({
                lower: lowerLimit.value,
                upper: upperLimit.value,
                formula: formulaInput.value
            });

            renderTerms(sequence.terms, sequence.formula);
            renderResults(sequence);

            generatedState = true;
            generateBtn.textContent = "Limpiar";
        } catch (error) {
            generatedState = false;
            generateBtn.textContent = "Generar sucesión";
            showError(error.message);
        }
    }

    generateBtn.addEventListener("click", () => {
        if (generatedState) {
            resetForm();
            return;
        }

        generate();
    });

    exampleBtn.addEventListener("click", () => {
        lowerLimit.value = "10";
        upperLimit.value = "30";
        formulaInput.value = "1/k";
        clearOutput();
        generate();
    });

    [lowerLimit, upperLimit, formulaInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                if (generatedState) {
                    resetForm();
                } else {
                    generate();
                }
            }
        });
    });

    clearOutput();
    generateBtn.textContent = "Generar sucesión";
});
