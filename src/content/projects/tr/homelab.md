---
title: "Ev Laboratuvarı"
summary: "Sanallaştırma, ağ, yedekleme ve Linux yönetimini pratik ettiğim, kendi barındırdığım bir Proxmox VE sunucusu."
role: "Bireysel proje"
period: { start: "[TODO: başlangıç yılı]", end: present }
status: ongoing
order: 4
featured: true
bento: wide
cover: ../_images/homelab/cover.svg
coverAlt: "Ev laboratuvarının rol şeması: Proxmox VE hipervizörü sanal makineleri ve konteynerleri çalıştırır; bunlar ayrı bir yedekleme hedefine yedeklenir."
tags: [linux, networking, self-hosting]
---

## Sorun

Sanallaştırma, ağ ve yedekleme hakkında okumak bir yere kadar işe yarıyor; ayrıntılar ancak gerçek servisleri çalıştırıp bozunca kalıcı oluyor. Bunu güvenle yapabileceğim ve sürekli çalışır tutabileceğim tek bir makine istedim.

## Ne yaptım

Kendi servislerim için sanal makineleri ve konteynerleri barındıran bir Proxmox VE hipervizörü çalıştırıyorum. Depolama ve ayrı bir yedekleme hedefi sürümlü kopyaları saklıyor, bir ters vekil sunucu trafiği servislere yönlendiriyor, bir VPN de servisleri internete açmadan uzaktan erişim sağlıyor. Hepsini Linux üzerinde yönetiyorum. [TODO: kurduğun veya otomatikleştirdiğin bir iki şey, yalnızca rol bazında]

## Sonuçlar

[TODO: örn. ne kadar süredir çalıştığı, rol bazında neleri barındırdığı, test ettiğin bir geri yükleme]

## Ne öğrendim

Bir yedek, ancak geri yükleme işe yaradığında sayılır; yaklaşımımı [3-2-1 yedekleme notumda](/tr/notes/ev-laboratuvarinda-yedekleme) anlatıyorum. [TODO: bir ders daha]
