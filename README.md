# LyED Toolkit

Interactive web toolkit developed for **Logic and Discrete Structures (LyED)** at ITESO.

It brings together tools for propositional logic, set operations, and sequences in a single web application.

🔗 **Live demo:** https://lyedtoolkits.netlify.app/

## Features

### Propositional Logic
- Validates arguments using critical rows or tautology.
- Generates complete truth tables.
- Supports negation, conjunction, disjunction, implication, and biconditional operators.
- Parses logical expressions using operator precedence and Reverse Polish Notation (RPN).

### Set Operations
- Loads sets from text files.
- Calculates the universe automatically.
- Supports union, intersection, difference, and symmetric difference.
- Provides guided and free-expression calculation modes.

### Sequences
- Generates sequence terms from a mathematical expression and a range.
- Calculates sums and products of generated terms.
- Supports common mathematical functions such as `sin`, `cos`, `sqrt`, and `log`.

## Technologies

- JavaScript
- HTML5
- CSS3
- Netlify

## Project Structure

```text
LyED-Toolkit/
├── validator-module1/   # Propositional logic and argument validation
├── sets-module2/        # Set operations
├── sequences-module3/   # Sequences, sums, and products
├── shared/              # Shared styles and resources
├── index.html           # Main page
└── app.js               # Main navigation
```

## Academic Context

LyED Toolkit was developed as an academic project at ITESO to apply concepts from logic and discrete structures through interactive web tools.

The project focuses on translating mathematical concepts into functional software while keeping the computational logic separated from the user interface.