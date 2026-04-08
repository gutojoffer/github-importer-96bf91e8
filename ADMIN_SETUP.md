# Configuração do Primeiro Administrador

## Como criar o primeiro usuário admin

O sistema Arena X usa uma tabela separada de roles (`user_roles`) para controlar permissões de acesso.

### Passo a passo

1. Certifique-se de que o usuário desejado já criou uma conta no sistema (via cadastro normal).

2. Acesse o painel do Lovable Cloud (backend).

3. Na tabela `user_roles`, localize o registro do usuário desejado pelo `user_id`.

4. Altere o campo `role` de `organizer` para `admin`.

   Ou insira um novo registro manualmente:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('<UUID_DO_USUARIO>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

5. O usuário agora terá acesso ao painel administrativo em `/admin`.

### Observações

- Apenas usuários com role `admin` na tabela `user_roles` podem acessar `/admin`.
- Cada novo usuário recebe automaticamente o role `organizer` ao se cadastrar.
- A verificação de admin é feita via função `has_role()` com `SECURITY DEFINER`, evitando problemas de recursão nas políticas RLS.
