---
title: "Why my first Meteor-M2 recording couldn't be decoded"
description: "I recorded a Meteor-M2-3 pass as FM-demodulated audio instead of raw IQ. Here's why LRPT needs baseband, and how I record now."
date: 2026-09-14
tags: [sdr, satellites, rf]
projects: [sdr-weather-satellites]
---

Meteor-M2-3 and M2-4 transmit LRPT, a digital phase-modulated signal near 137 MHz. My first pass looked fine in the waterfall, but SatDump found nothing to lock onto. I had recorded with SDR++ in WFM mode, so the file held demodulated audio, not the radio signal. FM demodulation throws away the phase information LRPT depends on, and no software can bring it back.

## What's actually in the file

| Recording mode | What's stored | LRPT decodable? |
|---|---|---|
| WFM audio | demodulated audio | No |
| Baseband IQ | raw complex samples | Yes |

## Recording baseband instead

Record the raw IQ stream at the satellite's frequency, then let SatDump demodulate it:

```sh
# 137.9 MHz, 1.024 MS/s, 8-bit IQ — [TODO: confirm the frequency for the satellite you track]
rtl_sdr -f 137.9e6 -s 1.024e6 meteor-pass.cu8
```

## Checklist for the next pass

- Fresh TLEs for pass prediction.
- Baseband recording, not audio.
- A sample rate that covers the signal bandwidth.
