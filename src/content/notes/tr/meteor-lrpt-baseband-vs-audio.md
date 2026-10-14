---
title: "İlk Meteor-M2 kaydım neden çözülemedi"
description: "Bir Meteor-M2-3 geçişini ham IQ yerine FM ile demodüle edilmiş ses olarak kaydettim. LRPT neden baseband kayıt ister, şimdi nasıl kaydediyorum?"
date: 2026-09-14
tags: [sdr, satellites, rf]
projects: [sdr-weather-satellites]
---

Meteor-M2-3 ve M2-4, 137 MHz civarında LRPT yayını yapar; bu, faz modülasyonlu dijital bir sinyal. İlk geçişim şelale ekranında gayet iyi görünüyordu, ama SatDump kilitlenecek hiçbir şey bulamadı. Kaydı SDR++'ta WFM modunda almıştım, yani dosyada radyo sinyali değil, demodüle edilmiş ses vardı. FM demodülasyonu LRPT'nin dayandığı faz bilgisini atar ve hiçbir yazılım onu geri getiremez.

## Dosyada aslında ne var

| Kayıt modu | Saklanan veri | LRPT çözülebilir mi? |
|---|---|---|
| WFM ses | demodüle edilmiş ses | Hayır |
| Baseband IQ | ham karmaşık örnekler | Evet |

## Bunun yerine baseband kaydetmek

Ham IQ akışını uydunun frekansında kaydedin, demodülasyonu SatDump'a bırakın:

```sh
# 137,9 MHz, 1,024 MS/s, 8 bit IQ — [TODO: takip ettiğin uydunun frekansını doğrula]
rtl_sdr -f 137.9e6 -s 1.024e6 meteor-pass.cu8
```

## Bir sonraki geçiş için kontrol listesi

- Geçiş tahmini için güncel TLE'ler.
- Ses değil, baseband kayıt.
- Sinyal bant genişliğini kapsayan bir örnekleme hızı.
