v0.0.1
- Added local scripts for parsing pdfs as png
    - using the `pdftk` in brew and `magick [input].pdf [output].png` command
    - for bulk file conversion use the following shell command: 

```sh
mkdir -p output_dir && for pdf in input_dir/*.pdf; do echo "Converting $(basename "$pdf")..."; magick "$pdf" "output_dir/$(basename "$pdf" .pdf).png"; done
```