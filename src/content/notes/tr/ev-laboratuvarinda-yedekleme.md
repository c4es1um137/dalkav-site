---
title: "Ev laboratuvarında 3-2-1 yedekleme"
description: "Üç kopya, iki farklı ortam, bir kopya dışarıda: 3-2-1 kuralını küçük bir ev sunucusunda nasıl uyguladığımı anlatıyorum."
date: 2026-08-20
tags: [homelab, linux, backup]
projects: [homelab]
---

Ev sunucusu kurmanın en keyifli kısmı yeni servisler eklemek; en sıkıcı kısmı ise yedekleme. Ama bir disk bozulduğunda ya da yanlış bir komut çalıştığında, geriye yalnızca **düzgün kurulmuş yedekler** kalıyor.

## Neden önemli?

3-2-1 kuralı basit: verinin **üç kopyası** olsun, bu kopyalar **iki farklı ortamda** dursun ve **bir kopya** evin dışında saklansın. Böylece tek bir arıza, hırsızlık ya da yangın her şeyi birden götürmez.

- *Üç kopya*: çalışan veri ve iki yedek.
- *İki ortam*: örneğin sunucunun kendi diski ve ayrı bir yedekleme diski.
- *Bir kopya dışarıda*: şifrelenmiş olarak başka bir yerde.

Kuralın en çok gözden kaçan kısmı zamanlama: yedekler **düzenli ve otomatik** alınmazsa, ihtiyaç anında elimizdeki kopya işe yaramayacak kadar eski olur. *Güncelliği ölçülmeyen* bir yedek, **doğrulanmış** bir yedek sayılmaz.

## Benim düzenim

[TODO: rol bazında anlat — sunucu adları, IP adresleri ve alan adları yazma]

## Geri yüklemeyi test etmek

Hiç geri yüklenmemiş bir yedek yalnızca bir umuttur. Bir sanal makineyi ya da tek bir dosyayı yedekten geri yükleyip gerçekten açıldığını görmek, yedeğin işe yaradığını göstermenin tek yolu. Proxmox VE'de sanal makine yedekleri `qmrestore` ile geri yüklenebilir; önemli olan, denemeyi çalışan sistemi bozmadan, ayrı bir kimlikle yapmak. Bunu bir şeylerin bozulduğu gün değil, sakin bir günde denemek gerekir: *ölçmediğin şeyi bildiğini sanma*.

[TODO: kendi geri yükleme testini ve ne sıklıkla yaptığını anlat]
