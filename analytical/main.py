import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)

x = sp.Symbol("x")
Y = sp.Symbol("Y")
dx = sp.Symbol("dx")
dy = sp.Symbol("dy")

y = sp.Function("y")
yx = y(x)

BASE_DICT = {
    "x": x,
    "dx": dx,
    "dy": dy,
    "e": sp.E,
    "pi": sp.pi,
    "I": sp.I,
    "i": sp.I
}

ALGEBRA_DICT = BASE_DICT | {
    "y": Y,
    "Y": Y,
}

ODE_DICT = BASE_DICT | {
    "y": yx,
}

TRANSFORMS = (
    *standard_transformations,
    implicit_multiplication_application,
)


def solve_ode(text: str):
    text = text.strip().replace(" ", "")

    is_ode = ("dx" in text or "dy" in text)

    is_differential_form = (
        is_ode
        and not any(
            derivative in text
            for derivative in ("dy/dx", "d2y/dx2", "d3y/dx3")
        )
    )

    if not is_ode:
        local_dict = ALGEBRA_DICT.copy()
        data = text.split("=")
        if len(data) != 2:
            raise ValueError("Не корректный синтаксис уравнения")

        lhs_text, rhs_text = data

        lhs = parse_expr(
            lhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )
        rhs = parse_expr(
            rhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )

        unknown = (lhs.free_symbols | rhs.free_symbols) - {x, Y}
        if unknown:
            names = ", ".join(sorted(map(str, unknown)))
            raise ValueError(f"Неизвестные переменные: {names}")

        ode = sp.Eq(lhs, rhs)
        return sp.solve(ode, Y)

    if is_differential_form:
        local_dict = ALGEBRA_DICT.copy()

        data = text.split("=")
        if len(data) != 2:
            raise ValueError("Не корректный синтаксис уравнения")

        lhs_text, rhs_text = data

        lhs = parse_expr(
            lhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )
        rhs = parse_expr(
            rhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )

        unknown = (lhs.free_symbols | rhs.free_symbols) - {x, Y, dx, dy}
        if unknown:
            names = ", ".join(sorted(map(str, unknown)))
            raise ValueError(f"Неизвестные переменные: {names}")

        expr = sp.expand(lhs - rhs)

        try:
            poly = sp.Poly(expr, dx, dy)
            if any(sum(monom) > 1 for monom, _ in poly.terms()):
                raise ValueError("Уравнение должно быть линейным по dx и dy")
        except sp.PolynomialError:
            raise ValueError("Некорректная дифференциальная форма")

        M = sp.simplify(expr.coeff(dx))
        N = sp.simplify(expr.coeff(dy))

        if M.has(dx, dy) or N.has(dx, dy):
            raise ValueError(
                "Некорректная форма уравнения в полных дифференциалах"
            )

        if M == 0 and N == 0:
            raise ValueError("Уравнение не содержит dx и dy или их порядки до 3")

        is_exact = sp.simplify(
            sp.diff(M, Y) - sp.diff(N, x)
        ) == 0

        if is_exact:
            F = sp.integrate(M, x)

            g_prime = sp.simplify(
                N - sp.diff(F, Y)
            )

            if g_prime.has(x):
                raise ValueError(
                    "Не удалось найти функцию y(x) для уравнения"
                )

            F = sp.simplify(
                F + sp.integrate(g_prime, Y)
            )

            C1 = sp.Symbol("C1")
            solutions = sp.solve(F - C1, Y)

            if solutions:
                return [
                    sp.Eq(yx, solution.subs(Y, yx))
                    for solution in solutions
                ]

            raise ValueError("Невозможно выразить y(x)")

        if N == 0:
            raise ValueError("Невозможно выразить dy/dx")

        ode = sp.Eq(
            sp.Derivative(yx, x),
            -M.subs(Y, yx) / N.subs(Y, yx),
        )

    else:
        derivative_map = {
            "d3y/dx3": sp.Derivative(yx, (x, 3)),
            "d2y/dx2": sp.Derivative(yx, (x, 2)),
            "dy/dx": sp.Derivative(yx, x),
        }

        placeholders = {}

        for i, (notation, derivative) in enumerate(
            derivative_map.items()
        ):
            placeholder = f"DERIVATIVE_PLACEHOLDER_{i}"

            if notation in text:
                text = text.replace(notation, placeholder)
                placeholders[placeholder] = derivative

        local_dict = ODE_DICT.copy() | placeholders

        data = text.split("=")
        if len(data) != 2:
            raise ValueError("Не корректный синтаксис уравнения")

        lhs_text, rhs_text = data

        lhs = parse_expr(
            lhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )
        rhs = parse_expr(
            rhs_text,
            local_dict=local_dict,
            transformations=TRANSFORMS,
        )

        ode = sp.Eq(lhs, rhs)

    return sp.dsolve(ode, yx)


def repr_solve_ode(equation):
    try:
        result = solve_ode(equation.replace("^", "**"))

        if not isinstance(result, list):
            result = [result]

        out = []

        for eq in result:
            if isinstance(eq, sp.Equality):
                value = eq.rhs
            else:
                value = eq

            formatted = str(value).replace("**", "^").replace("exp", "e^")

            out.append(formatted)

        return dict(ok=True, result=out)

    except Exception as error:
        return dict(ok=False, result=str(error))


