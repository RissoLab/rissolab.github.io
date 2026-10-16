magick stikers.png \
    -resize 1254x1254 \
    -background none \
    -gravity center \
    -extent 1254x1254 /tmp/sticker-square.png

  cwebp -q 90 -alpha_q 100 -exact \
    /tmp/sticker-square.png \
    -o stikers.webp
