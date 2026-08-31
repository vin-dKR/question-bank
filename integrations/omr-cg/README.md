# OMR_CG Integration

This directory vendors the Python OMR generator/checker from:

https://github.com/sourav08nitp/OMR_CG

The Next.js app calls it as a local subprocess through `lib/omr/service.ts`.
Generated sheet layouts are written to the OS temp directory at runtime, because
serverless deployments usually cannot write to the app directory.

## Runtime dependency

The server process needs Python plus the packages in `requirements.txt`:

```bash
python3 -m pip install -r integrations/omr-cg/requirements.txt
```

For local development, the app automatically uses `.venv-omr/bin/python` when
that virtualenv exists:

```bash
python3 -m venv .venv-omr
.venv-omr/bin/python -m pip install -r integrations/omr-cg/requirements.txt
```

Set `OMR_PYTHON_BIN` if the server should use a different interpreter:

```bash
OMR_PYTHON_BIN=/path/to/python
```
