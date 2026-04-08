document.addEventListener("DOMContentLoaded", () => {
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const clearAllBtn = document.getElementById("clearAllBtn");
    const exampleBtn = document.getElementById("exampleBtn");
    const calculateBtn = document.getElementById("calculateBtn");

    const setsList = document.getElementById("setsList");

    const guidedModeBtn = document.getElementById("guidedModeBtn");
    const freeModeBtn = document.getElementById("freeModeBtn");

    const guidedPanel = document.getElementById("guidedPanel");
    const freePanel = document.getElementById("freePanel");
    const symbolButtons = document.getElementById("symbolButtons");
    const expressionInput = document.getElementById("expressionInput");
    const operationPanel = document.querySelector(".operation-panel");

    const operationType = document.getElementById("operationType");
    const setOne = document.getElementById("setOne");
    const setTwo = document.getElementById("setTwo");

    const resultCard = document.getElementById("result-card");
    const resultCount = document.getElementById("resultCount");
    const resultBox = document.getElementById("resultBox");
    const resultMetaCount = document.getElementById("resultMetaCount");
    const resultMetaStatus = document.getElementById("resultMetaStatus");

    const AVAILABLE_SET_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("")
        .filter((letter) => letter !== "U");

    const OPERATION_SYMBOLS = {
        "Union": "∪",
        "Interseccion": "∩",
        "Diferencia": "-",
        "Diferencia simetrica": "△"
    };

    const EXAMPLE_SETS = [
        {
            fileName: "conjunto_A.txt",
            elements: ["a", "b", "c", "{a,c}", "1", "2", "3"]
        },
        {
            fileName: "conjunto_B.txt",
            elements: ["b", "c", "d", "3", "4", "x"]
        },
        {
            fileName: "conjunto_C.txt",
            elements: ["{a,c}", "d", "5", "6"]
        }
    ];

    let loadedSets = [];
    let universeSet = new Set();
    let currentMode = "guided";

    if (
        !uploadBtn || !fileInput || !clearAllBtn || !exampleBtn || !calculateBtn ||
        !setsList || !guidedModeBtn || !freeModeBtn || !guidedPanel || !freePanel ||
        !symbolButtons || !expressionInput || !operationPanel || !operationType ||
        !setOne || !setTwo || !resultCard || !resultCount || !resultBox ||
        !resultMetaCount || !resultMetaStatus
    ) {
        console.error("Faltan elementos necesarios en el DOM para sets-app.js");
        return;
    }

    function hideResultCard() {
        resultCard.classList.remove("is-visible");
        resultCard.classList.add("hidden");
    }

    function showResultCard(message, countText = "0 elementos", statusText = "✓ Sin duplicados") {
        resultBox.textContent = message;
        resultCount.textContent = countText;
        resultMetaCount.textContent = countText;
        resultMetaStatus.textContent = statusText;

        resultCard.classList.remove("hidden");

        requestAnimationFrame(() => {
            resultCard.classList.add("is-visible");
        });
    }

    function updateUploadButtonText() {
        uploadBtn.innerHTML = loadedSets.length
            ? `<span>⎘</span> Agregar archivo`
            : `<span>⎘</span> Cargar archivos`;
    }

    function getNextSetName(index) {
        if (index < AVAILABLE_SET_NAMES.length) {
            return AVAILABLE_SET_NAMES[index];
        }

        return `S${index + 1}`;
    }

    function parseFileContent(content) {
        return content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function computeUniverse() {
        const allElements = loadedSets.flatMap((setData) => setData.elements);
        universeSet = new Set(allElements);
    }

    function formatSetPreview(elements) {
        return elements.length
            ? `{ ${elements.join(", ")} }`
            : "{ }";
    }

    function createSetCard(label, fileName, elements, options = {}) {
        const {
            titleText = `Conjunto ${label}`,
            isUniverse = false,
            addMiniCard = false
        } = options;

        const article = document.createElement("article");
        article.className = `set-card${addMiniCard ? " mini-card" : ""}`;

        if (isUniverse) {
            article.innerHTML = `
                <div class="set-badge">${label}</div>
                <div class="set-info">
                    <div class="set-top">
                        <h3>${titleText}</h3>
                        <span class="set-size">${elements.length} elemento${elements.length === 1 ? "" : "s"}</span>
                    </div>
                    <div class="universe-upload">
                        <div>
                            <p class="file-name">${fileName}</p>
                            <div class="set-preview">${formatSetPreview(elements)}</div>
                        </div>
                    </div>
                </div>
            `;
            return article;
        }

        article.innerHTML = `
            <div class="set-badge">${label}</div>
            <div class="set-info">
                <div class="set-top">
                    <h3>${titleText}</h3>
                    <span class="set-size">${elements.length} elemento${elements.length === 1 ? "" : "s"}</span>
                </div>
                <p class="file-name">${fileName}</p>
                <div class="set-preview">${formatSetPreview(elements)}</div>
            </div>
        `;

        return article;
    }

    function buildSetMap() {
        const map = {};

        loadedSets.forEach((setData) => {
            map[setData.label] = new Set(setData.elements);
        });

        return map;
    }

    function updateSelectOptions() {
        const labels = loadedSets.map((setData) => setData.label);

        setOne.innerHTML = "";
        setTwo.innerHTML = "";

        labels.forEach((label) => {
            const optionOne = document.createElement("option");
            optionOne.value = label;
            optionOne.textContent = label;
            setOne.appendChild(optionOne);

            const optionTwo = document.createElement("option");
            optionTwo.value = label;
            optionTwo.textContent = label;
            setTwo.appendChild(optionTwo);
        });

        if (labels.length > 0) {
            setOne.value = labels[0];
        }

        if (labels.length > 1) {
            setTwo.value = labels[1];
        } else if (labels.length === 1) {
            setTwo.value = labels[0];
        }
    }

    function renderSets() {
        setsList.innerHTML = "";

        loadedSets.forEach((setData) => {
            setsList.appendChild(
                createSetCard(setData.label, setData.fileName, setData.elements)
            );
        });

        if (loadedSets.length > 0) {
            setsList.appendChild(
                createSetCard(
                    "U",
                    "calculado automáticamente",
                    [...universeSet],
                    {
                        titleText: "Universo U",
                        isUniverse: true,
                        addMiniCard: true
                    }
                )
            );
        }

        updateSelectOptions();
        updateUploadButtonText();
    }

    async function handleFiles(fileList) {
        const files = Array.from(fileList);

        if (!files.length) return;

        const usedLabels = new Set(loadedSets.map((setData) => setData.label));
        const availableLabels = AVAILABLE_SET_NAMES.filter((label) => !usedLabels.has(label));

        const newSets = await Promise.all(
            files.map(async (file, index) => {
                const content = await file.text();
                const elements = parseFileContent(content);

                return {
                    id: crypto.randomUUID(),
                    label: availableLabels[index] || `S${loadedSets.length + index + 1}`,
                    fileName: file.name,
                    rawContent: content,
                    elements
                };
            })
        );

        loadedSets = [...loadedSets, ...newSets];
        computeUniverse();
        renderSets();

        fileInput.value = "";
        hideResultCard();
    }

    function loadExample() {
        loadedSets = EXAMPLE_SETS.map((setData, index) => ({
            id: crypto.randomUUID(),
            label: getNextSetName(index),
            fileName: setData.fileName,
            rawContent: setData.elements.join("\n"),
            elements: [...setData.elements]
        }));

        computeUniverse();
        renderSets();

        expressionInput.value = "";
        hideResultCard();
    }

    function clearAll() {
        loadedSets = [];
        universeSet = new Set();

        setsList.innerHTML = "";
        setOne.innerHTML = "";
        setTwo.innerHTML = "";
        expressionInput.value = "";
        fileInput.value = "";

        updateUploadButtonText();
        hideResultCard();
    }

    function activateGuidedMode() {
        currentMode = "guided";

        guidedModeBtn.classList.add("active");
        freeModeBtn.classList.remove("active");

        guidedPanel.classList.remove("hidden");
        freePanel.classList.add("hidden");
        symbolButtons.classList.add("hidden");

        operationPanel.classList.add("guided-active");
        operationPanel.classList.remove("free-active");
    }

    function activateFreeMode() {
        currentMode = "free";

        freeModeBtn.classList.add("active");
        guidedModeBtn.classList.remove("active");

        freePanel.classList.remove("hidden");
        guidedPanel.classList.add("hidden");
        symbolButtons.classList.remove("hidden");

        operationPanel.classList.add("free-active");
        operationPanel.classList.remove("guided-active");
    }

    function insertAtCursor(input, text) {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;

        input.value = input.value.slice(0, start) + text + input.value.slice(end);

        const newCursorPosition = start + text.length;
        input.focus();
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    function setToSortedArray(resultSet) {
        return [...resultSet].sort((a, b) => String(a).localeCompare(String(b), "es"));
    }

    function formatResult(resultSet) {
        const sorted = setToSortedArray(resultSet);
        return sorted.length ? `{ ${sorted.join(", ")} }` : "{ }";
    }

    function runGuidedCalculation() {
        if (!loadedSets.length) {
            showResultCard("Primero carga al menos un archivo o usa Ver ejemplo.", "0 elementos", "⚠ Sin conjuntos");
            return;
        }

        const leftLabel = setOne.value;
        const rightLabel = setTwo.value;
        const operatorLabel = operationType.value;
        const operatorSymbol = OPERATION_SYMBOLS[operatorLabel];

        if (!leftLabel || !rightLabel || !operatorSymbol) {
            showResultCard("Faltan datos para la operación guiada.", "0 elementos", "⚠ Incompleto");
            return;
        }

        const expression = `${leftLabel}${operatorSymbol}${rightLabel}`;
        const setMap = buildSetMap();

        try {
            const result = window.LyEDSetLogic.evaluate(expression, setMap);
            const count = result.size;

            showResultCard(
                `${leftLabel} ${operatorSymbol} ${rightLabel} = ${formatResult(result)}`,
                `${count} elemento${count === 1 ? "" : "s"}`,
                "✓ Operación realizada"
            );
        } catch (error) {
            showResultCard(error.message, "0 elementos", "⚠ Error");
        }
    }

    function runFreeCalculation() {
        if (!loadedSets.length) {
            showResultCard("Primero carga al menos un archivo o usa Ver ejemplo.", "0 elementos", "⚠ Sin conjuntos");
            return;
        }

        const expression = expressionInput.value.trim();

        if (!expression) {
            showResultCard("Escribe una expresión para calcular.", "0 elementos", "⚠ Expresión vacía");
            return;
        }

        const setMap = buildSetMap();

        try {
            const result = window.LyEDSetLogic.evaluate(expression, setMap);
            const count = result.size;

            showResultCard(
                `${expression} = ${formatResult(result)}`,
                `${count} elemento${count === 1 ? "" : "s"}`,
                "✓ Operación realizada"
            );
        } catch (error) {
            showResultCard(error.message, "0 elementos", "⚠ Error");
        }
    }

    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", async (event) => {
        await handleFiles(event.target.files);
    });

    clearAllBtn.addEventListener("click", clearAll);
    exampleBtn.addEventListener("click", loadExample);

    calculateBtn.addEventListener("click", () => {
        if (currentMode === "guided") {
            runGuidedCalculation();
            return;
        }

        runFreeCalculation();
    });

    guidedModeBtn.addEventListener("click", activateGuidedMode);
    freeModeBtn.addEventListener("click", activateFreeMode);

    symbolButtons.addEventListener("click", (event) => {
        const button = event.target.closest("[data-symbol]");
        if (!button) return;

        const symbol = button.dataset.symbol;
        if (!symbol) return;

        insertAtCursor(expressionInput, symbol);
    });

    activateGuidedMode();
    updateUploadButtonText();
    hideResultCard();
});