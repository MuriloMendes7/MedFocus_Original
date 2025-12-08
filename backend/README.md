# MedFocus Backend

API mínima em Node.js + Express para permitir que o projeto MedFocus grave dados em um banco SQL (neste exemplo, SQLite). A estrutura é simples para que você possa trocar o driver facilmente por MySQL, PostgreSQL ou outro servidor SQL de sua preferência.

## Requisitos

- Node.js 18+
- npm

## Como instalar

```bash
cd backend
npm install
cp env.example .env
```

Se quiser usar outro banco SQL, atualize as variáveis no `.env` ou altere `src/db.js`.

## Executar em modo desenvolvimento

```bash
npm run dev
```

O servidor inicia em `http://localhost:4000` por padrão (configure `PORT` no `.env` se precisar).

## Rotas disponíveis

| Método | Rota                | Descrição                                        |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/health`           | Confere se o backend está no ar                  |
| GET    | `/api/patients`     | Lista pacientes cadastrados                      |
| POST   | `/api/patients`     | Cria um novo paciente na base de dados           |
| GET    | `/api/login-events` | Lista os últimos logins sincronizados do app     |
| POST   | `/api/login-events` | Recebe login + plano para liberar flashcards SQL |

### Exemplo de requisição `POST /api/patients`

```bash
curl -X POST http://localhost:4000/api/patients \
  -H "Content-Type: application/json" \
  -d '{ "name": "Maria Oliveira", "email": "maria@example.com", "notes": "Preferência turno manhã" }'
```

Resposta esperada:

```json
{
  "data": {
    "id": 1,
    "name": "Maria Oliveira",
    "email": "maria@example.com",
    "notes": "Preferência turno manhã"
  }
}
```

### Exemplo de requisição `POST /api/login-events`

```bash
curl -X POST http://localhost:4000/api/login-events \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "user_001",
        "name": "João Silva",
        "email": "joao@email.com",
        "plan": "premium",
        "deckBundle": "premium_full",
        "metadata": {
            "deckFiles": [
                "flashcards/anatomia-basica.json",
                "flashcards/clinico-essential.json",
                "flashcards/premium-intensivo.json"
            ]
        }
      }'
```

Ao receber este payload, o backend pode usar `plan`, `deckBundle` e `metadata.deckFiles` para anexar os arquivos corretos de flashcards ao usuário no banco SQL (ou acionar qualquer rotina de distribuição que você deseje).

## Integração com o frontend existente

No frontend, basta enviar uma requisição POST para `http://localhost:4000/api/patients` com o payload JSON. Exemplo em JavaScript:

```js
await fetch('http://localhost:4000/api/patients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    notes: 'Preferência turno manhã',
  }),
});
```

## Trocar SQLite por outro SQL

1. Instale o driver desejado (por exemplo, `npm install pg`).
2. Atualize `src/db.js` para abrir a conexão usando o driver escolhido.
3. Ajuste a string de conexão via `.env`.

Como a camada de serviço (`insertPatient` / `getPatients`) está isolada, a mudança fica concentrada no arquivo `db.js`.

