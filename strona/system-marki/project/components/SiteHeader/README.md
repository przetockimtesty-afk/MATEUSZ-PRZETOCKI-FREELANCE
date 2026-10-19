# SiteHeader

Menu strony: logo, pięć pozycji i przycisk do ankiety; na telefonie logo i przycisk menu.

- Pozycje: Dla kogo (rozwijane: branże), Oferta (rozwijane: Pakiety i ceny, Jak pracuję, Pytania), Realizacje, O mnie, Kontakt; przycisk „Wyceń stronę”.
- Bieżąca podstrona dostaje `current`.
- Poniżej 641 px menu samo pokazuje logo i przycisk menu, a przycisk ankiety przechodzi do `MobileCtaBar` na dole ekranu; `compact` wymusza tę wersję na każdej szerokości.
- Na komputerze menu przykleja się u góry i po przewinięciu dostaje cienką linię u dołu.
- Linki podajesz w `items[].href`, logo w `logoHref`, przycisk w `buttonHref`.
