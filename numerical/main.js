const formulaInput = document.getElementById("formulaInput");
const formulaButton = document.getElementById("formulaButton");
const buildButton = document.getElementById("buildButton");
const isoclineStepInput = document.getElementById("isoclineStepInput");
const isoclineInput = document.getElementById("isoclineInput");
const scaleInput = document.getElementById("scaleInput");
const rkStepInput = document.getElementById("rkStepInput");
const sxInput = document.getElementById("sxInput");
const syInput = document.getElementById("syInput");


let solutions = new Array();

formulaButton.addEventListener("click", async () => {
    formulaButton.disabled = true;
    buildButton.disabled = true;
    const inputFormula = formulaInput.value.replaceAll("y'", "differentiableFunction");
    let solutionsData;
    solutions = new Array();
    renderer.clear();
    renderer.renderText("Уравнение:");
    if ((inputFormula.match(/=/g) || []).length != 1 || !inputFormula.includes("differentiableFunction")){
        renderer.renderText("Не распознано ОДУ первого порядка");
        return
    }
    try {
        renderer.renderTeX(nerdamer(inputFormula).toTeX().replaceAll("differentiableFunction","{(y^{\\prime})}"));
        solutionsData = nerdamer.solve(nerdamer(inputFormula).toString(), "differentiableFunction");
    } catch (error) {
        renderer.renderText("Не удалось выразить производную или распознанать уравнение");
        console.error(error);
        formulaButton.disabled = false;
        buildButton.disabled = false;
        return;
    }
    renderer.renderTeX("\\text{Решениe(-ия)} \\ {y^{\\prime}} \\text{:}");
    for (let solutionData of solutionsData.symbol.elements) {
        console.log((solutionData.toString()))
        let solution = nerdamer(nerdamer(solutionData.toString()).toString());
        renderer.renderData(solution);
        solutions.push(solution);
    }
    formulaButton.disabled = false;
    buildButton.disabled = false;
});



buildButton.addEventListener("click", async () => {
    if (solutions.length == 0) {
        return;
    }
    formulaButton.disabled = true;
    buildButton.disabled = true;

    if (scaleInput.value.length == 0) {
        scaleInput.value = scaleInput.min;
    }
    const scale = Number(scaleInput.value);
    chart.setScale(scale);

    chart.clear();
    if (isoclineStepInput.value.length == 0) {
        isoclineStepInput.value = isoclineStepInput.min;
    }
    const isoclineStep = Number(isoclineStepInput.value);

    // Метод Изоклин
    if (isoclineInput.value.length == 0) {
        isoclineInput.value = isoclineInput.min;
    }
    const isoclineLength = Number(isoclineInput.value);
    for (let y = chart.getMinY(); y < chart.getMaxY(); y+=isoclineStep) {
        for (let x = chart.getMinX(); x < chart.getMaxX(); x+=isoclineStep) {
            for (let solution of solutions) {
                try {   
                    let k = Number(solution.evaluate({x:x, y:y}).text());
                    const half = isoclineLength / 2;
                    const norm = Math.sqrt(1 + k * k);

                    const dx = half / norm;
                    const dy = k * half / norm;
                    chart.drawLine([
                        { x: x - dx, y: y - dy },
                        { x: x + dx, y: y + dy }
                    ], "blue", 1);
                } catch (error) {

                }
                
                
            }
        }
    }
    

    // Метод Рунге-Кутты
    if (sxInput.value.length == 0) {
        sxInput.value = sxInput.min;
    }
    const sx = Number(sxInput.value);
    if (syInput.value.length == 0) {
        syInput.value = syInput.min;
    }
    const sy = Number(syInput.value);
    if (rkStepInput.value.length == 0) {
        rkStepInput.value = rkStepInput.min;
    }
    const rkStep = Number(rkStepInput.value);
    for (let solution of solutions) {
        for (const dir of [1, -1]) {
            let x = sx, y = sy;
            while (x > chart.getMinX() && x < chart.getMaxX()) {
                try {
                    const k1 = Number(solution.evaluate({ x, y }).text());
                    const k2 = Number(solution.evaluate({ x: x + rkStep * dir / 2, y: y + rkStep * dir * k1 / 2 }).text());
                    const k3 = Number(solution.evaluate({ x: x + rkStep * dir / 2, y: y + rkStep * dir * k2 / 2 }).text());
                    const k4 = Number(solution.evaluate({ x: x + rkStep * dir, y: y + rkStep * dir * k3 }).text());

                    const nextX = x + rkStep * dir;
                    const nextY = y + rkStep * dir * (k1 + 2 * k2 + 2 * k3 + k4) / 6;
                    if (![k1, k2, k3, k4, nextY].every(Number.isFinite)) break;

                    chart.drawLine([{ x, y }, { x: nextX, y: nextY }], "red", 3);

                    x = nextX;
                    y = nextY;
                } catch (error) {
                    console.error(error);
                    break;
                }
            }
        }
    }
    formulaButton.disabled = false;
    buildButton.disabled = false;
});



formulaInput.value = "y'=y+cos(x)-sin(x)";
renderer.renderText("Графопостроитель готов к работе!");
formulaButton.disabled = false;
buildButton.disabled = false;