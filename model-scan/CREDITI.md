# Crediti di PiattinoScan

PiattinoScan è una EfficientNet-B0 ([timm](https://github.com/huggingface/pytorch-image-models), Apache 2.0, pre-addestrata su ImageNet) rifinita per riconoscere i cibi di Piattino. Le foto servono solo per l'addestramento: non sono contenute nell'app.

## Foto

- **Food-101** (Bossard, Guillaumin e Van Gool, ETH Zürich, 2014), dataset per la ricerca: 34.719 foto di 101 piatti, dalla copia su Hugging Face (`ethz/food101`).
- **Wikimedia Commons**: 7.295 foto di 91 cibi, scelte con le ricerche in `scripts/classes.py` della cartella di addestramento e controllate in automatico con MobileCLIP2. L'elenco completo, con autore, licenza e pagina di ogni foto, è in [`crediti-foto.tsv`](crediti-foto.tsv).

| Licenza | Foto |
| --- | --- |
| CC BY-SA 4.0 | 2897 |
| CC BY 2.0 | 1008 |
| CC0 | 944 |
| CC BY-SA 3.0 | 836 |
| CC BY-SA 2.0 | 483 |
| Public domain | 392 |
| CC BY 4.0 | 306 |
| CC BY 3.0 | 161 |
| CC BY-SA 2.5 | 50 |
| OGL 2 | 50 |
| CC BY 3.0 us | 32 |
| GFDL 1.2 | 31 |
| No restrictions | 19 |
| CC BY 2.5 | 15 |
| CC BY-SA 3.0 de | 15 |
| FAL | 10 |
| GFDL | 8 |
| CC BY-SA 2.0 fr | 6 |
| CC BY-SA 1.0 | 6 |
| Attribution | 5 |
| CC BY 3.0 it | 5 |
| CC BY-SA 2.0 de | 3 |
| Copyrighted free use | 2 |
| CC BY-SA 3.0 it | 2 |
| CC BY-SA 2.0 kr | 2 |
| CC BY 2.0 kr | 2 |
| CC BY 1.0 | 1 |
| CC BY 2.5 au | 1 |
| CC BY-SA 3.0 at | 1 |
| KOGL Type 1 | 1 |
| Public Domain | 1 |

Grazie a tutti gli autori che condividono le loro foto con licenza libera.
