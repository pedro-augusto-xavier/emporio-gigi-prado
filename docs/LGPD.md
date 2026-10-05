# LGPD: como o sistema trata dados pessoais

Este documento é um guia técnico e **não substitui orientação jurídica**. A Política de Privacidade
publicada no site precisa ser revisada antes de ir ao ar.

## Dados coletados

| Dado | De quem | Para quê | Base legal (art. 7º) | Quanto tempo |
|---|---|---|---|---|
| Nome, e-mail, senha (hash) | Cliente com conta | Login e identificação | Execução de contrato (V) | Até o pedido de exclusão |
| Telefone | Cliente / visitante | Contato sobre reserva ou entrega | Execução de contrato (V) | Até a exclusão; reservas são anonimizadas |
| Dados da reserva | Cliente / visitante | Organizar mesas | Execução de contrato (V) | Histórico anonimizado após exclusão |
| Endereço e itens do pedido | Cliente / visitante | Preparar e entregar o pedido | Execução de contrato (V) | Mantido como registro de venda; dados pessoais anonimizados após exclusão |
| Aceite de marketing | Cliente com conta | Enviar promoções | Consentimento (I) | Revogável a qualquer momento |
| Trilha de auditoria (sem dados pessoais) | Equipe | Prestação de contas | Legítimo interesse (IX) | Indeterminado |

## Direitos do titular (art. 18) → rotas da API

| Direito | Rota |
|---|---|
| Confirmação e acesso | `GET /api/me` |
| Correção | `PATCH /api/me` |
| Portabilidade | `GET /api/me/export` (JSON com conta, consentimentos, reservas e pedidos) |
| Revogação do consentimento | `PUT /api/me/consents` |
| Eliminação | `DELETE /api/me` (pede a senha, anonimiza, cancela reservas futuras e pedidos pendentes; bloqueada enquanto houver pedido em andamento, porque o endereço ainda é necessário para a entrega) |

Visitantes sem conta podem consultar e cancelar reservas e pedidos pelo **código + telefone**. Outras solicitações
(por exemplo, apagar os dados de uma reserva feita sem conta) são atendidas pelo canal do encarregado (DPO).

## Medidas de segurança (art. 46)

- Senhas com **scrypt** + salt; nunca são registradas em log nem devolvidas pela API.
- Refresh token em cookie `httpOnly` + `SameSite=Strict`, guardado no banco **apenas como hash**,
  com rotação e detecção de reuso (token roubado derruba todas as sessões).
- Access token de 15 minutos.
- Limite de requisições por IP (geral e mais rígido no login, cadastro e consulta de reservas).
- Cabeçalhos de segurança (Helmet), CORS restrito às origens configuradas.
- Validação de toda entrada com Zod; consultas parametrizadas pelo ORM (sem SQL injection).
- Logs com `authorization` e `cookie` mascarados.
- Controle de acesso por papel (`admin`, `staff`, `kitchen`, `courier`, `customer`).
- Consentimento registrado com a **versão da política** (`POLICY_VERSION`) e histórico imutável.

## Pendências antes de publicar

- [ ] Redigir Termos de Uso e Política de Privacidade (com nome e contato do encarregado).
- [ ] HTTPS obrigatório em produção (`COOKIE_SECURE=true`).
- [ ] Backup do banco criptografado e com retenção definida.
- [ ] Definir prazo de retenção para reservas antigas de visitantes e criar rotina de anonimização.
