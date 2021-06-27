#!/bin/bash

set -o nounset                              # Treat unset variables as an error

function help() {
  echo -e "-a:\t apri con EDITOR o vim"
  echo -e "-r:\t richiedi riassunto"
  echo -e "-i:\t richiedi immagine"
  echo -e "-h:\t visualizza questo messaggio"
}


function apri() {
  if [ "$#" -lt 1 ]; then
    echo "$0: manca il nome del file"
    return 1
  fi

  if [ -z "${EDITOR+x}" ]; then
    echo "Variabile \$EDITOR vuota, provo con Vim"
    EDITOR=vim
  fi

  which "$EDITOR"
  if [ "$?" -ne "0" ]; then
    echo "Impossibile aprire il file con $EDITOR"
    return 1
  fi

  $EDITOR $1
}

APRI=0
RIASSUNTO=0
IMMAGINE=0

img=""
excerpt=""

optstring="arih"

while getopts "$optstring" arg; do
  case "$arg" in
    a)
      APRI=1
      ;;
    r)
      RIASSUNTO=1
      ;;
    i)
      IMMAGINE=1
      ;;
    h|?)
      help
      exit 0
      ;;
  esac
done



echo -en "Titolo: "
read titolo

while true; do
  echo -en "Lingua: "
  read lingua

  if [ "$lingua" != "it" ] && [ "$lingua" != "en" ]; then
    echo -e "\nChe lingua è?\n"
  else
    break
  fi
done


echo -en "Nome link: "
read nome_link

echo -en "lang-id: "
read lang_id


while true; do
  echo -en "Data: "
  read data
  if [ -z "$data" ]; then
    data=$(date -j +"%Y-%m-%d")
    break
  fi

  date -jf "%Y-%m-%d" "$data" &> /dev/null
  if [ "$?" -ne "0" ]; then
    echo -e "\nErrore: Data non valida\n"
  else
    break
  fi
done


if [ "$IMMAGINE" -eq "1" ]; then
  while true; do
    echo -en "Immagine: "
    read img

    if [ ! -f "$img" ]; then
      echo -e "\nImmagine non esistente\n"
    else
      break
    fi
  done
fi

if [ "$RIASSUNTO" -eq "1" ]; then
  echo -en "Riassunto: "
  read excerpt
fi


FILE="$lingua/_posts/$data-$nome_link.md"

echo "---"                >> $FILE
echo "layout: post"       >> $FILE
echo "title: $titolo"     >> $FILE
echo "lang: $lingua"      >> $FILE

if [ ! -z "$lang_id" ]; then
  echo "lang-id: $lang_id"  >> $FILE
fi

if [ ! -z "$img" ]; then
  echo "image: $img"      >> $FILE
fi

if [ ! -z "$excerpt" ]; then
  echo "excerpt: $excerpt"  >> $FILE
fi
echo "---"                >> $FILE

if [ "$APRI" -eq "1" ]; then
  apri $FILE
  exit $?
fi



