---
title: "Weather Satellites with SDR"
summary: "Receiving and decoding LRPT images from the Meteor-M2-3 and M2-4 weather satellites with an RTL-SDR, SDR++ and SatDump."
role: "Solo project"
period: { start: "[TODO: start year]", end: present }
status: ongoing
order: 3
featured: true
bento: standard
cover: ../_images/sdr-weather-satellites/cover.svg
coverAlt: "Block diagram of the receive chain: antenna at 137 MHz, low-noise amplifier, RTL-SDR producing IQ samples, SatDump demodulating and decoding, and the final LRPT image."
tags: [sdr, rf, satellites]
---

## The problem

The Russian Meteor-M2-3 and M2-4 weather satellites broadcast LRPT, a digital image downlink, near 137 MHz (137.1 and 137.9 MHz). Anyone with a cheap receiver can pick it up during a pass, but only if the recording keeps the signal intact and the pass is predicted accurately.

## What I did

I receive passes with an RTL-SDR, watch and record them in SDR++, and decode the recordings with SatDump. My first attempt failed because I recorded demodulated audio instead of raw IQ; [I wrote up why](/notes/meteor-lrpt-baseband-vs-audio). The same setup also covers other amateur-satellite work: HADES SSTV and ISS APRS and SSTV. [TODO: antenna type, LNA and where you receive from, described generally]

## Results

[TODO: number of successful passes or a best decoded image, with a gallery entry]

## What I learned

A digital downlink is unforgiving: the recording format matters as much as the antenna, and fresh orbital elements make the difference between catching a pass and missing it. [TODO: one more lesson]
