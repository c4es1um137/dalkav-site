---
title: "SDR ile Meteoroloji Uyduları"
summary: "RTL-SDR, SDR++ ve SatDump ile Meteor-M2-3 ve M2-4 meteoroloji uydularından LRPT görüntüleri almak ve çözmek."
role: "Bireysel proje"
period: { start: "[TODO: başlangıç yılı]", end: present }
status: ongoing
order: 3
featured: true
bento: standard
cover: ../_images/sdr-weather-satellites/cover.svg
coverAlt: "Alış zinciri blok şeması: 137 MHz anten, düşük gürültülü yükselteç, IQ örnekleri üreten RTL-SDR, demodülasyon ve çözme yapan SatDump ve ortaya çıkan LRPT görüntüsü."
tags: [sdr, rf, satellites]
---

## Sorun

Rus meteoroloji uyduları Meteor-M2-3 ve M2-4, 137 MHz civarında (137,1 ve 137,9 MHz) LRPT adlı dijital bir görüntü yayını yapar. Ucuz bir alıcısı olan herkes bir geçiş sırasında bu yayını yakalayabilir; ama yalnızca kayıt sinyali bozmadan saklıyorsa ve geçiş doğru tahmin edildiyse.

## Ne yaptım

Geçişleri bir RTL-SDR ile alıyor, SDR++ ile izleyip kaydediyor ve kayıtları SatDump ile çözüyorum. İlk denemem, ham IQ yerine demodüle edilmiş ses kaydettiğim için başarısız oldu; [nedenini yazdım](/tr/notes/meteor-lrpt-baseband-vs-audio). Aynı düzenle başka amatör uydu çalışmaları da yapıyorum: HADES SSTV ile ISS APRS ve SSTV. [TODO: anten tipi, LNA ve nereden aldığın, genel ifadelerle]

## Sonuçlar

[TODO: başarılı geçiş sayısı veya en iyi çözülen görüntü, galeriye eklenmiş olarak]

## Ne öğrendim

Dijital bir yayın hata affetmiyor: kayıt biçimi anten kadar önemli ve güncel yörünge verileri bir geçişi yakalamakla kaçırmak arasındaki farkı yaratıyor. [TODO: bir ders daha]
