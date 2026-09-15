# Sistema de Papeletas - SIGA

Sistema para el registro de papeletas de salida del personal, control de portería y
generación de reportes PDF. Se integra al SIGA (autenticación manejada por el SIGA).

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Hook Form
- **Backend:** Node.js + Express + PDFKit
- **Base de datos:** MySQL 8

## Requisitos

- Docker y Docker Compose instalados

## Puesta en marcha

```bash
docker-compose up --build
```

Accesos:

| Servicio  | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:5173   |
| Backend   | http://localhost:5000   |
| API health| http://localhost:5000/api/health |

La base de datos se inicializa automáticamente con el esquema de `database/init.sql`.

## Funcionalidades

1. **Registro de papeleta**: datos del trabajador (nombre, Nº de tarjeta, oficina),
   motivos de salida (comisión de servicios, asuntos personales, otros),
   control de portería (hora salida, horario retorno) y establecimientos
   visitados (institución, lugar, horas, numeración en orden).
2. **Reportes PDF**: reporte por rango de fechas y/o Nº de tarjeta con resumen
   por trabajador, detalle de cada papeleta con sus establecimientos y firmas.

## Estructura

```
sistema-papeletas/
├── docker-compose.yml
├── database/init.sql          # Esquema MySQL
├── backend/                   # Express API + PDFKit
└── frontend/                  # React + Vite + Tailwind
```

## Nota de integración SIGA

La autenticación y el ingreso al sistema son manejados por el SIGA. Este módulo
expone solo la parte de papeletas; posteriormente se conectará a la infraestructura
de usuarios del SIGA.