-- Descrição opcional do workflow (metadados para listagem / detalhe)
ALTER TABLE workflows ADD COLUMN description TEXT NOT NULL DEFAULT '';
