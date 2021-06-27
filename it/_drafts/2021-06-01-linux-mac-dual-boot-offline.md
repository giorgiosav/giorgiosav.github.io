---
layout: post
title: Installare Linux sul Mac senza collegamento Ethernet
lang: it
excerpt: "Come installare Linux sul Mac e collegarsi alla rete senza una
	connessione Ethernet. Parlo in particolare di Ubuntu e Debian e do qualche
	consiglio per il <i>dual boot</i>."
lang-id: linux-mac-dual-boot-offline
---

Se avete un Mac recente, avrete notato che non ha una porta Ethernet. Forse
avrete anche notato che gli adattatori USB-Ethernet della Apple non sono proprio
economici. Potreste comprare un adattatore di terze parti, ma che divertimento
c'è se il computer si collega ad Internet senza alcuna difficoltà? 

Bene, allora cominciamo. Parlerò di come collegare il computer al Wi-Fi sia con
Ubuntu che con Debian, ma vi avverto che **ci sono riuscito solo con Ubuntu**.
Su Debian ho seguito tutte le istruzioni, ma niente... se ci riuscite, fatemelo
sapere. Scriverò anche qualche consiglio personale su come fare il _dual boot_, 
visto che non credo vogliate rinunciare a MacOS 


## A cosa serve il collegamento Ethernet?

Cominciamo con un ripassino veloce veloce, chi di voi è già ferrato sul tema può
tranquillamente saltare questa sezione.

Un computer è fatto di vari componenti hardware che interagiscono fra di loro:
il touchpad, la tastiera, la scheda grafica, la scheda Wi-Fi, ecc... Ognuno di
questi componenti viene programmato con del codice detto _firmware_ (o
"componente logico permanente", secondo [Wikipedia](https://it.wikipedia.org/wiki/Firmware)). 
Il sistema operativo poi controlla ogni componente con un programma apposito
detto _driver_, che interagisce con il _firmware_.

Qual è il problema? Se avete un Mac recente, per esempio, la scheda Wi-Fi non è
prodotta dalla Apple, ma molto probabilmente da
[Broadcom](https://www.broadcom.com/) e il _driver_ che serve per controllarla è
proprietario, ovvero non disponibile pubblicamente. Se avete MacOS come sistema
operativo, il _driver_ è già installato e fila tutto liscio, ma su Linux
difficilmente lo troverete già installato. Per questo, nel processo
d'installazione Linux proverà a collegarsi ad Internet per scaricarlo, ma come
fa a collegarsi se non ha il _driver_ della scheda Wi-Fi?

Ecco allora a cosa serve il collegamento Ethernet: per potersi connettere e
scaricare il _driver_ della scheda Wi-Fi (più eventual altri programmi che
potrebbero servire). Fine del ripassino.


## Cosa vi servirà

Non molto: una chiavetta USB (consiglio almeno 4GB) e [Docker](https://www.docker.com/) installato.
Date anche un'occhiata ai requisiti di sistema nella pagina d'installazione del
sistema operativo.

Docker servirà a scaricare il software necessario per poi trasferirlo su Linux.
Se preferite, potete usare una macchina virtuale, per esempio con [VirtualBox](https://www.virtualbox.org/),
ma Docker è molto più leggero e veloce.

Per trasferire i file tra MacOS e Linux, io personalmente ho creato una
partizione del disco apposita. È abbastanza semplice e conveniente e vi
spiegherò come farlo, ma se preferite evitarlo basterà usare un'altra chiavetta
USB.

## 1 - Creare una USB "Live"

### Scaricare l'immagine

Una USB "Live" (viva!) vi permette di provare il sistema operativo senza
installarlo, inserendo semplicemente la chiavetta ed avviando il sistema da lì.
Sia su Ubuntu che su Debian è abbastanza facile e ci dà la possibilità di
vedere se l'installazione del firmware funziona, senza dover installare tutto
il sistema operativo.

Innanzitutto scaricatevi l'immagine (`.iso`). Vi metto i link qui sotto ma controllate la
data dell'articolo ({{ page.date | date : "%F" }}), perché potrebbero essere vecchi. Basta
cercare "_ubuntu/debian live usb image_" per trovarle facilmente.

* [Immagine live di Ubuntu](https://ubuntu.com/download/desktop)
* [Immagine live di Debian](https://www.debian.org/CD/live/), i link sono a metà
  pagina sotto "**DVD/USB**".

Mi raccomando, occhio ai dettagli:
* Per il Mac, dovete scegliere l'architettura "AMD64".
* **Per scegliere la versione del sistema operativo**: se usate Docker, fate un salto su [Docker
  Hub](https://hub.docker.com/_/ubuntu) e cercate i contenitori di
  [Ubuntu](https://hub.docker.com/_/ubuntu) o [Debian](https://hub.docker.com/_/debian). 
  Verificate che la versione che scaricate ci sia, altrimenti scaricatene un'altra. 
  L'importante è che le versioni dell'immagine live e del contenitore di Docker
  coincidano.
* Nel caso di Debian, nel link troverete un sacco di immagini diverse dette
  _flavors_ (gusti), a seconda dell'interfaccia grafica (GNOME, KDE, ...). Io
  preferisco GNOME, ma insomma _de gustibus_...

### Verificare l'immagine

È improbabile che un file scaricato dal sito ufficiale di Debian o Ubuntu sia
contraffatto, ma è sempre bene verificare le firme digitali e i checksum.

Per questa parte vi rimando a [un ottimo tutorial sul sito di
Ubuntu](https://ubuntu.com/tutorials/how-to-verify-ubuntu) e alla più scarna
[guida sul sito di Debian](https://www.debian.org/CD/verify).

### Scrivere l'immagine sulla chiavetta

Una volta scaricata l'immagine `.iso`, bisogna scriverla (masterizzarla o
_burn_) su chiavetta. La prima cosa da fare è formattare la chiavetta.

**OCCHIO!!** Con questo passo **perderete irreversibilmente tutti i dati 
salvati nella chiavetta**, assicuratevi che non ci sia nulla di importante.

Inserite la chiavetta ed aprite "Utility Disco" (se non lo trovate, cercatelo
su Spotlight), selezionate il nome della chiavetta a sinistra e poi
"inizializza". Per il formato e lo schema, potete lasciarli come sono, ma per
sicurezza come formato sceglierei "MS-DOS".

Completata la formattazione, è ora di scrivere l'immagine `.iso`: aprite
il terminale ed eseguite:

```bash
diskutil list
```

Dovreste vedere una cosa del genere:

```
/dev/disk2 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *8.1 GB     disk2
   1:                 DOS_FAT_32 <NAME>  ⁩                8.1 GB     disk2s1
```

Questo vuol dire che la chiavetta si trova su `/dev/disk2`, nella
partizione 1 (`s1`). Ora **occhi aperti**:

```
dd if=<immagine_linux.iso> of=/dev/rdisk<n> bs=1m
```

* `<immagine_linux.iso>` sta ad indicare il percorso dell'immagine `.iso`
* `/dev/rdisk<n>` vuol dire questo: se la chiavetta si trova, per esempio, su
  `/dev/disk2`, dovrete scrivere `/dev/rdisk2`. **Non dimenticate la 'r'!**,
  altrimenti il processo di scrittura impiegherà molto più tempo (ore, lo so
  per esperienza).
* `bs` sta per _block size_, `if`/`of` invece per _input/output file_


Dovrebbero volerci una decina di minuti -- _et voilà_.


### Avvio da chiavetta USB

Spegnete il computer, inserite la chiavetta e riaccendetelo. Appena sentite
il suono di accensione ("Oooooooooo 🎶") tenete premuto il tasto `alt` (⌥).
Dovreste vedere 2 immagini di un disco di avvio: una per il Mac e un'altra
chiamata "EFI boot", o simile. Selezionate questa e il computer
dovrebbe avviare Linux dalla chiavetta.


## 2 - Trovare il firmware e i pacchetti necessari



## 3 - Creare una partizione *swap*



## 4 - Creare una partizione condivisa (opzionale)

Una partizione condivisa serve a trasferire file da un sistema operativo
all'altro. Non è necessaria, perché potete anche semplicemente usare un'altra
chiavetta USB, ma è abbastanza semplice da fare ed utile. Se avete un po'
di spazio libero, vi consiglio di crearne una.




