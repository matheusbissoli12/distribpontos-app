#!/usr/bin/env bash
# Roda os testes do banco num Postgres local (porta 5499). Uso: bash supabase/tests/run.sh
set -e
cd "$(dirname "$0")/.."
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-5499} -U ${PGUSER:-postgres} -v ON_ERROR_STOP=1 -q -t -A"
$P -c "drop database if exists dp_test" >/dev/null
$P -c "create database dp_test" >/dev/null
$P -d dp_test -f tests/00_supabase_stub.sql >/dev/null
$P -d dp_test -f migrations/0001_schema.sql 2>&1 | grep -v NOTICE || true
$P -d dp_test -f migrations/0002_bairros_grande_vitoria_opcional.sql >/dev/null
$P -d dp_test -f tests/10_fluxos.sql 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  //' | grep -v '^$'
