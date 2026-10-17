import { python } from "./pyodide.js";



export async function solveODE(equation) {
    return python(`repr_solve_ode(${JSON.stringify(equation)})`).then( result => {
        console.log(`repr_solve_ode(${JSON.stringify(equation)})`);
        let data = result.toJs({
            dict_converter: Object.fromEntries
        });
        result.destroy();
        console.log(data);
        return data;
    });
}


export function mapNerdamer(solutions){
    let out = [];
    for (let solution of solutions) {
        out.push(nerdamer(solution));
    }
    return out;
}