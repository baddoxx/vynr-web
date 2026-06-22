---
title: Less Is More
date: 2026-06-22
type: journal
description: How an over-built time lens got cut back to three plain modes — and how the code underneath got more complex, not less.
tags:
  - design
  - time lens
  - less is more
---

A cellar isn't only a *where* — it's a *when*. vynr already had a way to move through time: the wines you've drunk, where you are now, and where the bottles are still heading. I'd built it, and then I'd kept adding to it.

![The first build — a jewelled time scrubber, an engraved medallion, a mountain curve, layered italic captions over a faint map](/journal/timelens-ornate.png)

A scrubber with a coloured notch for every bottle. An engraved medallion in the middle. A mountain curve behind it. *Memories* and *Evolution* with their arrows. A headline, a subtitle, a second subtitle, and a map ghosted under all of it.

We have a test for this kind of thing: does a screen answer *what is this?* or *how should I feel?* This one answered the second question, loudly, before it had told you anything true about your cellar. I'd built a fairground.

So I went back to paper.

## The sketch

![The notebook storyboard — three panels: a memories rail, a now-scrubber with arrows, an evolution curve](/journal/timelens-sketch.jpg)

The notebook version had three panels: the past, now, and the future. That was the whole thing. The version I'd shipped had accumulated a scrubber, a medallion, captions, a mountain and a map. Somewhere along the way I'd started solving a different problem — making it look impressive — instead of the one I'd actually drawn.

The embarrassing part is that the sketch was clearer than the implementation, and it had taken thirty seconds with a pen.

## Cutting it back

![The stripped build — three modes, Memories and Evolution above, Now below, large serif type and open space](/journal/timelens-stripped.jpg)

The redesign was mostly deletion. The scrubber went. The medallion went. The mountain went. What was left were the three modes the sketch had asked for — *Memories* and *Evolution* as two doors, *Now* underneath — one line of copy, and the numbers. The map stayed, but only as background.

The surprising part wasn't that it looked better. It was that I stopped thinking about it. I'd open the Time Lens and think about which bottles were ready to drink, not about the interface. That was the clearest signal the redesign was heading the right way.

## What it cost

![The vynr source as a knowledge graph — thousands of nodes in a dense glowing sphere, every line a dependency](/journal/vynr-code-galaxy.png)

Here's the part that doesn't show up on screen. Behind those three modes sit thousands of appellation ageing curves, producer profiles, the OCR that reads the label, the map projections, and a confidence score on every guess. A bottle you scan falls through all of that before the three doors can render.

So the surface got simpler and the code underneath got more complex — not less. *Less is more* didn't mean less work. It meant spending more of it deciding what to leave out, and then building enough underneath to make the result look obvious.

The fairground was the easy version. The simple one cost far more.

---

*Less on the screen. More underneath it.*
