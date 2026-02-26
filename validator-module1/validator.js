/**
 * LyED ToolKit (Validator UI)
 * Controla únicamente interfaz:
 * - Agregar/quitar hipótesis (1 a 10)
 * - Leer inputs y mandar a LYED_LOGIC para generar tabla / validar
 * - Renderizar banner + tabla de verdad
 *
 * Nota: Este archivo NO implementa lógica proposicional; eso vive en logic.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    if (window.__LYED_VALIDATOR_INIT__) return;
    window.__LYED_VALIDATOR_INIT__ = true;

    const MAX = 10;
    const MIN = 1;

    const hypothesesEl = document.getElementById("hypotheses");
    const addBtn = document.getElementById("addHypBtn");
    const countText = document.getElementById("countText");
    const conclusionInput = document.getElementById("conclusionInput");
    const resultBox = document.getElementById("resultBox");
    const clearBtn = document.getElementById("clearBtn");
    const criticalBtn = document.getElementById("criticalBtn");
    const tautBtn = document.getElementById("tautBtn");

    const exampleBtn = document.getElementById("exampleBtn");
    const symbolsBtn = document.getElementById("symbolsBtn");
    const symbolsBox = document.getElementById("symbolsBox");

    if (
        !hypothesesEl || !addBtn || !countText || !conclusionInput ||
        !resultBox || !clearBtn || !criticalBtn || !tautBtn
    ) {
        console.error("Falta un elemento del DOM (IDs).");
        return;
    }

    const getHypothesisValues = () => {
        return Array.from(hypothesesEl.querySelectorAll(".hyp-input"))
            .map((i) => i.value.trim())
            .filter((v) => v.length > 0);
    };

    const clearResult = () => {
        resultBox.innerHTML = "";
    };

    const updateLabels = () => {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");

        rows.forEach((row, i) => {
            const label = row.querySelector(".hyp-label");
            if (label) label.textContent = `H${i + 1}`;
        });

        countText.textContent = `(${rows.length}/${MAX})`;
        addBtn.classList.toggle("hidden", rows.length >= MAX);

        // Cuando solo hay 1 hipótesis: ocultamos botón "-" y expandimos el grid
        rows.forEach((row) => {
            const removeBtn = row.querySelector(".hyp-remove");
            const onlyOne = rows.length <= MIN;

            row.classList.toggle("no-remove", onlyOne);
            if (removeBtn) removeBtn.classList.toggle("hidden", onlyOne);
        });
    };

    const makeRow = (value = "") => {
        const row = document.createElement("div");
        row.className = "hyp-row";

        const label = document.createElement("div");
        label.className = "hyp-label";
        label.textContent = "H?";

        const input = document.createElement("input");
        input.className = "hyp-input";
        input.type = "text";
        input.placeholder = "Escribe una hipótesis...";
        input.value = value;

        const remove = document.createElement("button");
        remove.className = "hyp-remove";
        remove.type = "button";
        remove.title = "Quitar hipótesis";
        remove.textContent = "–";

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(remove);

        return row;
    };

    const setSymbolsHelp = () => {
        if (!symbolsBox) return;
        symbolsBox.textContent =
            "Símbolos válidos: ¬ ~ (negación), ∧ ^ (y), ∨ v (o), → -> > (implica), ↔ <-> <=> (bicondicional), ( ) paréntesis. Variables: letras (p, q, r...).";
    };

    const renderBanner = ({ kind, mode, detail }) => {
        // kind: valid | invalid | vacuous | error
        // mode: "Renglón Crítico" | "Tautología"
        const titles = {
            valid: `Argumento válido — ${mode}`,
            invalid: `Argumento inválido — ${mode}`,
            vacuous: `Argumento vacuo — ${mode}`,
            error: "Fórmula inválida",
        };

        const subtitles = {
            valid: detail || "La validación fue exitosa.",
            invalid: detail || "Hay al menos un caso que rompe la validez.",
            vacuous: detail || "No hay filas con premisas verdaderas (vacuidad).",
            error: detail || "Revisa la sintaxis.",
        };

        const icon = kind === "valid" ? "✓" : (kind === "invalid" ? "×" : "!");
        const cls = kind === "valid" ? "ok" : (kind === "invalid" ? "bad" : "vac");

        resultBox.innerHTML = `
          <div class="banner ${cls}">
            <div class="banner-icon">${icon}</div>
            <div>
              <div class="banner-title">${titles[kind]}</div>
              <div class="banner-sub">${subtitles[kind]}</div>
            </div>
            <button class="banner-close" type="button" aria-label="Cerrar">×</button>
          </div>
        `;

        const closeBtn = resultBox.querySelector(".banner-close");
        if (closeBtn) closeBtn.addEventListener("click", clearResult, { once: true });
    };

    const renderTruthTable = (table, extra) => {
        // extra: { criticalRows?: number[], showImplication?: boolean }
        const { variables, hypothesesPretty, conclusionPretty, rows } = table;

        const criticalSet = new Set(extra?.criticalRows || []);
        const showImplication = Boolean(extra?.showImplication);

        const headerCells = [
            ...variables.map((v) => `<th>${v}</th>`),
            ...hypothesesPretty.map((h, i) => `<th>${h}<div class="truth-small">(h${i + 1})</div></th>`),
            `<th>∴ ${conclusionPretty}<div class="truth-small">(q)</div></th>`,
        ];

        if (showImplication) {
            headerCells.push(`<th>(h1 ∧ ... ∧ hn) → ∴Q</th>`);
        }

        const bodyRows = rows.map((row, idx) => {
            const vals = variables.map((v) => (row.valuation[v] ? "V" : "F"));
            const hyps = row.hypotheses.map((b) => (b ? "V" : "F"));
            const concl = row.conclusion ? "V" : "F";

            const premisesAll = row.hypotheses.every(Boolean);
            const implication = (!premisesAll) || row.conclusion;

            const isCritical = criticalSet.has(idx);
            const trClass = isCritical ? "critical" : "";

            const cells = [
                ...vals.map((c) => `<td class="truth-sym">${c}</td>`),
                ...hyps.map((c) => `<td class="truth-sym">${c}</td>`),
                `<td class="truth-sym">${concl}</td>`,
            ];

            if (showImplication) {
                cells.push(`<td class="truth-sym">${implication ? "V" : "F"}</td>`);
            }

            return `<tr class="${trClass}">${cells.join("")}</tr>`;
        });

        const chipText = showImplication
            ? "Implicación (premisas → conclusión)"
            : "Renglón(es) crítico(s) marcado(s)";

        resultBox.insertAdjacentHTML(
            "beforeend",
            `
            <div class="truth">
              <div class="truth-head">
                <div class="truth-title">
                  TABLA DE VERDAD <span class="truth-meta">· ${rows.length} renglones</span>
                </div>
                <div class="truth-chip">${chipText}</div>
              </div>

              <div class="truth-wrap">
                <table class="truth-table">
                  <thead><tr>${headerCells.join("")}</tr></thead>
                  <tbody>${bodyRows.join("")}</tbody>
                </table>
              </div>
            </div>
            `
        );
    };

    const runCritical = () => {
        clearResult();

        try {
            const hyps = getHypothesisValues();
            const concl = conclusionInput.value.trim();

            const table = window.LYED_LOGIC.buildTruthTable(hyps, concl);
            const verdict = window.LYED_LOGIC.validateByCriticalRow(table);

            if (verdict.kind === "vacuous") {
                renderBanner({
                    kind: "vacuous",
                    mode: "Renglón Crítico",
                    detail: "No hay escenarios donde todas las hipótesis sean verdaderas.",
                });
                renderTruthTable(table, { criticalRows: [] });
                return;
            }

            renderBanner({
                kind: verdict.kind === "valid" ? "valid" : "invalid",
                mode: "Renglón Crítico",
                detail:
                    verdict.kind === "valid"
                        ? "En todo renglón crítico, la conclusión es verdadera."
                        : "Existe al menos un renglón crítico donde la conclusión es falsa.",
            });

            renderTruthTable(table, { criticalRows: verdict.criticalRows });
        } catch (err) {
            renderBanner({
                kind: "error",
                mode: "Renglón Crítico",
                detail: err?.message || "Error desconocido",
            });
        }
    };

    const runTautology = () => {
        clearResult();

        try {
            const hyps = getHypothesisValues();
            const concl = conclusionInput.value.trim();

            const table = window.LYED_LOGIC.buildTruthTable(hyps, concl);
            const verdict = window.LYED_LOGIC.validateByTautology(table);

            renderBanner({
                kind: verdict.kind === "valid" ? "valid" : "invalid",
                mode: "Tautología",
                detail:
                    verdict.kind === "valid"
                        ? "La implicación (premisas → conclusión) es tautología."
                        : "La implicación (premisas → conclusión) NO es tautología.",
            });

            renderTruthTable(table, { showImplication: true });
        } catch (err) {
            renderBanner({
                kind: "error",
                mode: "Tautología",
                detail: err?.message || "Error desconocido",
            });
        }
    };

    // Eventos UI principales
    addBtn.addEventListener("click", () => {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length >= MAX) return;

        hypothesesEl.appendChild(makeRow(""));
        updateLabels();
        clearResult();
    });

    hypothesesEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".hyp-remove");
        if (!btn) return;

        const rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length <= MIN) return;

        const row = btn.closest(".hyp-row");
        if (row) row.remove();

        updateLabels();
        clearResult();
    });

    clearBtn.addEventListener("click", () => {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        updateLabels();
        clearResult();
    });

    criticalBtn.addEventListener("click", runCritical);
    tautBtn.addEventListener("click", runTautology);

    // Ayuda de símbolos + ejemplo (si existen en el HTML)
    if (symbolsBtn && symbolsBox) {
        setSymbolsHelp();
        symbolsBtn.addEventListener("click", () => {
            symbolsBox.classList.toggle("hidden");
        });
    }

    if (exampleBtn) {
        exampleBtn.addEventListener("click", () => {
            // Ejemplo simple (ajústalo si quieres otro)
            const inputs = hypothesesEl.querySelectorAll(".hyp-input");
            if (inputs[0]) inputs[0].value = "p → q";
            if (inputs[1]) inputs[1].value = "p";
            conclusionInput.value = "q";
            clearResult();
        });
    }

    updateLabels();
});