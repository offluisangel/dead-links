# Uso Local

Para probar dead-links en tu vault antes de publicarlo.

## Instalar deps y build

```bash
pnpm install
pnpm run build
```

## Usar directamente con node

```bash
node dist/index.js scan --vault "D:\Documents\brain"
```

## O instalarlo globalmente

```bash
pnpm add -g .
```

Ahora puedes usarlo desde cualquier lado:

```bash
dead-links scan --vault "D:\Documents\brain"
dead-links broken --vault "D:\Documents\brain"
dead-links orphans --vault "D:\Documents\brain"
dead-links graph --vault "D:\Documents\brain"
dead-links report --vault "D:\Documents\brain"
```

## Para quitarlo

```bash
pnpm remove -g dead-links
```

## Tip: probar con el vault de ejemplo

```bash
node dist/index.js scan --vault tests/fixtures/sample-vault
```

## Ignorar folders de orphans

Carpetas como `Films/`, `Trunk/`, `Diario/` suelen tener notas sueltas por naturaleza. Para excluirlas del reporte de orphans:

```bash
dead-links scan --vault "D:\Documents\brain" --ignore-folders Films Trunk Diario
```

También funciona en `orphans`:

```bash
dead-links orphans --vault "D:\Documents\brain" --ignore-folders Films Trunk
```

O en el config `.deadlinksrc.json`:

```json
{
  "ignoreFolders": ["Films", "Trunk", "Diario", "Books", "Games"]
}
```

## Attachments

Por defecto no revisa si imágenes, PDFs, docx, etc. existen. Solo revisa links entre notas `.md`.

Para incluir attachments también:

```bash
dead-links scan --vault "D:\Documents\brain" --attachments
```

O en el config:

```json
{
  "checkAttachments": true
}
```
