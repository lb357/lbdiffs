class Renderer{
    constructor(id) {
        this.latex = document.getElementById(id);
    }

    clear() {
        this.latex.replaceChildren();
    }
    
    renderData(data) {
        this.renderTeX(data.toTeX());
    }

    renderText(text){
        this.renderTeX("\\text{"+text+"}");
    }

    renderTeX(tex){
        var li = document.createElement('li');
        li.appendChild(document.createElement('div'));

        katex.render(tex, li, {
            throwOnError: false
        });

        this.latex.appendChild(li);
    }
}

class FunctionGraph extends Chart{
    constructor(chartId, paramsId) {
        super(document.getElementById(chartId), {
            type: 'scatter',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: { y: 0 },
                        min: -60,
                        max: 60,
                        border: {
                            color: '#000',
                            width: 2
                        }
                    },
                    y: {
                        type: 'linear',
                        position: { x: 0 },
                        min: -30,
                        max: 30,
                        border: {
                            color: '#000',
                            width: 2
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        this.params = document.getElementById(paramsId);
        this.variables = new Set();
        this.solutions = [];
    }


    renderFunctions() {
        const length = 2;
        const C1 = this.getParam("C1");
        const C2 = this.getParam("C2");
        const C3 = this.getParam("C3");

        if (C1 != null) {
            /*for (let solution of [this.solutions[0]]) {
                const C1d = nerdamer.solve(solution.toString() + '=y', 'C1');
                const diff = nerdamer.diff(solution, "x")
                console.log(solution.toString(), C1d.toString(), diff.toString())
                for (let y = this.options.scales.y.min; y <= this.options.scales.y.max; y+=(this.options.scales.y.max-this.options.scales.y.min)/10){
                    for (let x = this.options.scales.x.min; x <= this.options.scales.x.max; x+=(this.options.scales.x.max-this.options.scales.x.min)/10){
                        let C1dValue = Number(C1d.evaluate({"x": x, "y": y, "C2": C2, "C3": C3}).valueOf().elements[0].valueOf());
                        let diffValue;
                        try { 
                            diffValue = Number(diff.evaluate({"x": x, "C1": C1dValue, "C2": C2, "C3": C3}).valueOf());
                        } catch(e) {
                            //console.log(e)
                            diffValue = Number.MAX_VALUE;
                        }

                        let res = Number(solution.evaluate({"x": x, "C1": C1dValue, "C2": C2, "C3": C3}).valueOf());
                        console.log(x, y, diff.toString(), diffValue, C1dValue, C1d.toString(), solution.toString(), res);
                        const norm = Math.sqrt(1 + diffValue ** 2);
                        const dx = length / 2 / norm;
                        const dy = diffValue * dx;
                        const tangent = {
                            data: [
                                { x: x - dx, y: y - dy },
                                { x: x + dx, y: y + dy }
                            ],
                            borderColor: 'blue',
                            borderWidth: 2,
                            showLine: true,
                            pointRadius: 0
                        };
                        this.data.datasets.push(tangent);

                    }
                }
                    
            }*/
        }
        for (let solution of this.solutions) {
            let line = {
                data: [],
                borderColor: 'red',
                borderWidth: 4,
                showLine: true,
                pointRadius: 0
            };

            let points = new Set();
            for (let x = this.options.scales.x.min; x <= this.options.scales.x.max; x+=0.25) {
                points.add(x);
            }

            try {
                let zeros = nerdamer.solve(nerdamer(solution.toString()+"=0"), "x");
                for (zero of zeros.valueOf().elements) {
                    console.log(nerdamer(zero).evaluate({"C1": C1, "C2": C2, "C3": C3}));
                    points.add(nerdamer(zero).evaluate({"C1": C1, "C2": C2, "C3": C3}));
                }
            } catch (err) {}
            for (let x of Array.from(points).sort((a,b)=>a-b)) {
                try {
                    let y = Number(solution.evaluate({"x": x, "C1": C1, "C2": C2, "C3": C3}).valueOf());
                    line.data.push({x: x, y: y})
                } catch (err) {
                    this.data.datasets.push(line);
                    line = {
                        data: [],
                        borderColor: 'red',
                        borderWidth: 4,
                        showLine: true,
                        pointRadius: 0
                    };
                }
            }
            this.data.datasets.push(line);

        }
        this.update();
    }

    storeFunctions(solutions) {
        this.params.replaceChildren();
        this.variables = new Set();
        this.solutions = solutions;
        for (let solution of solutions){
            for (let variable of solution.variables()) {
                this.variables.add(variable);
            }
        }
        this.variables.delete("x");

        for (let variable of this.variables) {
            this.addParamSlider(variable);
        }
    }

    addParamSlider(paramName) {
        let li = document.createElement('li');
        let label = document.createElement('label')
        let slider = document.createElement('input')
        slider.type = "range";
        slider.id = "param_"+paramName;
        slider.min = -1000;
        slider.max = 1000;
        slider.value = 0;
        slider.name = paramName;
        label.htmlFor = "param_"+paramName;
        label.innerHTML = paramName+"=0";
        li.appendChild(slider);
        li.appendChild(label);
        slider.addEventListener('change', (event) => {label.innerHTML = paramName+"="+event.target.value;});
        this.params.appendChild(li);
        return li;
    }

    getParam(paramName) {
        let param = document.getElementById("param_"+paramName)
        if (param != null) {
            return param.value;
        } else {
            return null;
        }
    }

    clearGraph() {
        this.data.datasets = [];
        this.update();
    }
}


const renderer = new Renderer("latex");
const chart = new FunctionGraph('chart', 'params');

