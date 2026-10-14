---
title: "Designing a Formula Student accumulator: the rules decide first"
description: "Before cell choice or cooling, the Formula Student rules fix most of an accumulator's architecture. Here's how I learned to design backwards from them."
date: 2026-07-02
tags: [formula-student, high-voltage, batteries]
projects: [itu-racing-electrical]
---

It is tempting to start an accumulator design with the exciting parts: which cells, how much energy, how to cool them. In Formula Student that order is backwards. The rules already decide most of the architecture, and a pack that ignores them will not pass scrutineering, however good the cells are.

## The constraints come first

The rules limit how much voltage and energy a single accumulator segment may hold, which decides how the pack is split into segments. They cap the maximum tractive-system voltage, which fixes how many cells can sit in series. They require isolation between the high-voltage system and the chassis, and fusing that protects the wiring and cells. Scrutineers then check these things physically, on the car, not only on paper.

[TODO: exact limits and rule numbers from the FS Rules version you used]

## Where the trade-offs live

Once the rules have drawn the box, the real engineering is inside it. More cells mean more energy but more mass; more mass needs more cooling, and every extra part makes the pack harder to open, inspect and repair between events. Serviceability is easy to forget on paper and painful to lack at a competition.

## What scrutineering taught me

[TODO: what you learned from preparing the car for EV scrutineering]
