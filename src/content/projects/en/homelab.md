---
title: "Homelab"
summary: "A self-hosted Proxmox VE server where I practise virtualisation, networking, backups and Linux administration."
role: "Solo project"
period: { start: "[TODO: start year]", end: present }
status: ongoing
order: 4
featured: true
bento: wide
cover: ../_images/homelab/cover.svg
coverAlt: "Role diagram of the homelab: a Proxmox VE hypervisor runs virtual machines and containers, which are backed up to a separate backup target."
tags: [linux, networking, self-hosting]
---

## The problem

Reading about virtualisation, networking and backups only goes so far; running real services and breaking them is how the details stick. I wanted one machine where I could do that safely and keep it running.

## What I did

I run a Proxmox VE hypervisor that hosts virtual machines and containers for my own services. Storage and a separate backup target keep versioned copies, a reverse proxy routes traffic to services, and a VPN gives me remote access without exposing services to the internet. I administer it all on Linux. [TODO: one or two things you built or automated, described by role only]

## Results

[TODO: e.g. how long it has run, what it hosts by role, a restore you tested]

## What I learned

Backups only count once a restore has worked; I describe my approach in [a Turkish note on 3-2-1 backups](/tr/notes/ev-laboratuvarinda-yedekleme). [TODO: one more lesson]
